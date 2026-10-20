create table users (
  username text primary key not null check (length(trim(username)) > 0),
  passwordHash text not null
);
