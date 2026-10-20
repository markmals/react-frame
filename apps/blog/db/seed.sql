-- Demo comments for the blog. Statements are idempotent so the seed is safe to run against an
-- already-seeded database. `post_slug` matches a file in app/content/posts.

insert or ignore into comments (id, post_slug, author_name, body, created_at) values
  (1, 'rendering-on-the-server-again', 'Dana Whitfield', 'The part about shipping markup first finally made the trade-off click for me. We moved our marketing pages over last quarter and the difference on cheap Android phones is not subtle.', 1772452800000),
  (2, 'rendering-on-the-server-again', 'Oskar Lindqvist', 'Curious how you handle the pieces that genuinely need to be interactive. Do you still reach for a client router, or is everything a form post?', 1772539200000),
  (3, 'rendering-on-the-server-again', 'Maren Oduya', 'Forms, mostly. The handful of places that need real interaction get an island, and the island talks to the server with the same function the form posts to.', 1772625600000),
  (4, 'the-case-for-nested-routes', 'Priya Venkatesan', 'The "a layout is just a route that embeds other routes" framing is the one I keep stealing in design reviews. It makes caching boundaries obvious.', 1773057600000),
  (5, 'progressive-enhancement-is-not-nostalgia', 'Hollis Barrera', 'We ran the no-JavaScript test on our checkout last month and found three dead buttons. Worth doing even if you never ship it as a feature.', 1773662400000),
  (6, 'sqlite-is-enough', 'Theo Nakamura', 'One caveat worth adding: WAL mode and a sensible busy timeout. Without them the first concurrent write is a nasty surprise.', 1774267200000),
  (7, 'sqlite-is-enough', 'Maren Oduya', 'Agreed, that belongs in the post. Both are one line of configuration and they turn the scary failure mode into a short wait.', 1774353600000),
  (8, 'measuring-what-users-feel', 'Ingrid Sollas', 'Field data over lab data, every time. Our lab numbers looked great right up until we segmented by device class.', 1774785600000);
