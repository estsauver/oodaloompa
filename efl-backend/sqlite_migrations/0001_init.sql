create table if not exists cards (
  id            text primary key,
  kind          text not null,
  state         text not null,
  payload       json not null,
  created_at    datetime not null default current_timestamp,
  updated_at    datetime not null default current_timestamp
);

create table if not exists queue_events (
  id            integer primary key autoincrement,
  card_id       text not null,
  event         text not null,
  actor         text not null,
  meta          json,
  created_at    datetime not null default current_timestamp
);

create table if not exists wakes (
  id            integer primary key autoincrement,
  card_id       text not null,
  wake_at       datetime not null,
  reason        text not null,
  created_at    datetime not null default current_timestamp
);

create table if not exists traces (
  id            integer primary key autoincrement,
  card_id       text not null,
  model         text,
  prompt_tokens integer,
  output_tokens integer,
  elapsed_ms    integer,
  content_hash  text,
  created_at    datetime not null default current_timestamp
);

create index if not exists idx_wakes_time on wakes (wake_at);
create index if not exists idx_qe_card on queue_events (card_id, created_at desc);

