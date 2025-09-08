create table if not exists slack_threads (
  card_id    text primary key,
  channel    text not null,
  thread_ts  text not null,
  created_at datetime not null default current_timestamp
);
create unique index if not exists idx_slack_threads_chan_ts on slack_threads (channel, thread_ts);

