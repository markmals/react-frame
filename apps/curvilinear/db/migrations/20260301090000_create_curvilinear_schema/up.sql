create table issues (
  id integer primary key autoincrement,
  title text not null,
  description text not null,
  status text not null,
  priority text not null,
  status_rank integer not null,
  priority_rank integer not null,
  username text not null,
  created_at integer not null,
  modified_at integer not null
);

create index issues_status_idx on issues (status);
create index issues_priority_idx on issues (priority);
create index issues_created_at_idx on issues (created_at);
create index issues_modified_at_idx on issues (modified_at);
create index issues_status_rank_idx on issues (status_rank);
create index issues_priority_rank_idx on issues (priority_rank);

create table comments (
  id integer primary key autoincrement,
  issue_id integer not null,
  body text not null,
  username text not null,
  created_at integer not null,
  constraint comments_issue_id_fk foreign key (issue_id) references issues (id) on delete cascade
);

create index comments_issue_id_idx on comments (issue_id, created_at);
