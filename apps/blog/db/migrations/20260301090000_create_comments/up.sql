create table comments (
  id integer primary key autoincrement,
  post_slug text not null,
  author_name text not null,
  body text not null,
  created_at integer not null
);

create index comments_post_slug_idx on comments (post_slug, created_at);
