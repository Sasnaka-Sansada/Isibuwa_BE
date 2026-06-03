-- ============================================================
--  002_seed_event.sql — Seed a sample Isibuwa music event
--  Run AFTER 001_init.sql. Safe to re-run (ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO events (
  id,
  title,
  description,
  date,
  venue,
  capacity,
  ticket_price,
  artists
)
VALUES (
  1,
  'Isibuwa Festival 2026',
  'The biggest music event of the year returns! Join us for an unforgettable night of live music, electrifying performances, and pure energy. Isibuwa Festival 2026 brings together the finest artists across genres — from Afrobeats to R&B, Jazz to Electronic — for one epic celebration. Limited spots available.',
  '2026-06-06 18:00:00+05:30',
  'Deraniyagala, Kegalle',
  150,
  500.00,
  '[
    {"name": "M.G. Buddhima Prasad Priyanath", "genre": "Vocalist", "image": "Artisit1.jpeg", "bio": "Talented vocalist from Rathnapura, bringing soulful classical and fusion performances."},
    {"name": "Hashara Sandamini", "genre": "Vocalist", "image": "Artisit2.jpeg", "bio": "Enchanting vocal artist from Rathnapura, known for expressive melodies and pop fusion."},
    {"name": "R.A. Devindi Hirushika", "genre": "Vocalist", "image": "Artisit3.jpeg", "bio": "Vibrant performing artist from Kegalle, blending traditional rhythms with contemporary styles."},
    {"name": "Sasanda Sankalana", "genre": "Instrumentalist", "image": "Artisit4.jpeg", "bio": "Versatile multi-instrumentalist from Kalutara, delivering energetic live music."},
    {"name": "S. Rasindu Karunathilaka", "genre": "Vocalist", "image": "Artisit5.jpeg", "bio": "Rising star from Rathnapura, capturing audiences with powerful vocals and stage presence."}
  ]'::JSONB
)
ON CONFLICT (id) DO NOTHING;
