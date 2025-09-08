use std::time::Duration;
use axum::{Router, extract::State, response::sse::{Event, Sse}};
use futures::{Stream, StreamExt};
use tokio_stream::wrappers::{IntervalStream, BroadcastStream};

use crate::{AppState, sse::SseEvent};

pub fn routes() -> Router<AppState> {
    Router::new().route("/cards", axum::routing::get(stream_cards))
}

async fn stream_cards(State(state): State<AppState>) -> Sse<impl Stream<Item = Result<Event, std::convert::Infallible>>> {
    // Subscribe to broadcast channel
    let rx = state.sse_tx.subscribe();
    let bus = BroadcastStream::new(rx).filter_map(|msg| async move {
        match msg {
            Ok(SseEvent { event, data }) => {
                let evt = Event::default().event(event).data(data);
                Some(Ok(evt))
            }
            Err(_) => None,
        }
    });

    // Initial hydrate on connect
    let initial = futures::stream::once(async move {
        let payload = serde_json::json!({ "cards": [], "afterCount": 0 });
        Ok(Event::default().event("queue.hydrate").data(payload.to_string()))
    });

    // Heartbeat altimeter every 5s
    let interval = tokio::time::interval(Duration::from_secs(5));
    let heartbeat = IntervalStream::new(interval).map(move |_| {
        let payload = serde_json::json!({
            "kind": "altimeter.update",
            "systemAltitude": "Do",
            "progress": {"doCount":0,"shipGreen":0,"shipTotal":0,"amplifyDone":0,"amplifyTotal":0,"orientOk":true},
            "rationale": null
        });
        Ok(Event::default().event("altimeter.update").data(payload.to_string()))
    });

    let stream = initial.chain(bus).chain(heartbeat);
    Sse::new(stream)
}
