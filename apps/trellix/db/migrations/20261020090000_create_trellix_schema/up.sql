create table accounts (
  id text primary key,
  email text not null unique,
  created_at integer not null
);

create table passwords (
  account_id text primary key,
  hash text not null,
  constraint passwords_account_id_fk foreign key (account_id) references accounts (id) on delete cascade
);

create table boards (
  id integer primary key autoincrement,
  name text not null,
  color text not null,
  created_at integer not null,
  account_id text not null,
  constraint boards_account_id_fk foreign key (account_id) references accounts (id) on delete cascade
);

create index boards_account_id_idx on boards (account_id);

-- `sort_order` holds the fractional order Trellix stores in `order`; the query builder writes
-- column names unquoted, so a SQL keyword cannot be used as a column name here.
create table columns (
  id text primary key,
  name text not null,
  sort_order real not null,
  board_id integer not null,
  constraint columns_board_id_fk foreign key (board_id) references boards (id) on delete cascade
);

create index columns_board_id_idx on columns (board_id);

create table items (
  id text primary key,
  title text not null,
  content text,
  sort_order real not null,
  column_id text not null,
  board_id integer not null,
  constraint items_column_id_fk foreign key (column_id) references columns (id) on delete cascade,
  constraint items_board_id_fk foreign key (board_id) references boards (id) on delete cascade
);

create index items_column_id_idx on items (column_id);
create index items_board_id_idx on items (board_id);
