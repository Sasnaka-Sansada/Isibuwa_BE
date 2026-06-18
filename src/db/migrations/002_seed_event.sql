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
  artists,
  moderators,
  vocalists,
  instrumentalists,
  reviewers
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
  ]'::JSONB,
  '[
    {
      "name": "Chamindu Gamage",
      "genre": "Master of Ceremonies",
      "image": "Moderor.jpg",
      "district": "Kegalle",
      "bio": "An elegant presenter and seasoned host, guiding the festival through smooth transitions and immersive storytelling."
    }
  ]'::JSONB,
  '[
    {
      "name": "Sasanda Sankalana",
      "genre": "Vocalist",
      "image": "Artisit6.jpg",
      "district": "Kandy",
      "bio": "A legendary vocal artist, celebrated for his profound classical roots and expressive, soul-stirring melodies."
    },
    {
      "name": "Devindi Rajapaksha",
      "genre": "Vocalist",
      "image": "Artisit8.jpg",
      "district": "Kegalle",
      "bio": "An avant-garde composer and singer, blending deep acoustic textures with traditional Sri Lankan folk music."
    },
    {
      "name": "Hashara Sandamini",
      "genre": "Vocalist",
      "image": "Artisit9.jpg",
      "district": "Rathnapura",
      "bio": "A powerhouse vocalist whose versatility spans classical opera to high-energy contemporary fusion."
    },
    {
      "name": "Buddhima Prasad Priyanath",
      "genre": "Vocalist",
      "image": "Artisit5.jpg",
      "district": "Rathnapura",
      "bio": "A rhythm specialist whose rapid-fire classical beats define the tempo of the performance."
    }
  ]'::JSONB,
  '[
    {
      "name": "Malshan Ranawella",
      "genre": "Vocalist, Violinist",
      "image": "Artisit11.jpg",
      "district": "Badulla",
      "bio": "Project Manager, Altria Consulting(Pvt) Ltd Vocalist, violinist"
    },
    {
      "name": "Punsarani Anodya",
      "genre": "Violinist",
      "image": "Artisit1.jpeg",
      "district": "Colombo",
      "bio": "Renowned for his precise, classical techniques and contribution to local orchestral fusion projects."
    },
    {
      "name": "Methnal Liyanage",
      "genre": "Flutist",
      "image": "Artisit2.jpeg",
      "district": "Galle",
      "bio": "Captivating listeners with serene traditional ragas and innovative classical interpretations."
    },
    {
      "name": "Ravindu Dileepa",
      "genre": "Lead Guitarist",
      "image": "Artisit3.jpeg",
      "district": "Rathnapura",
      "bio": "A dynamic percussionist specializing in traditional Sri Lankan low-country and up-country drumming."
    },
    {
      "name": "Rasindu Karunathilaka",
      "genre": "Lead Guitarist",
      "image": "Artisit4.jpeg",
      "district": "Rathnapura",
      "bio": "Crafting atmospheric soundscapes using classical wooden flutes and modern wind fusion styles."
    },
    {
      "name": "Minhaj Ali",
      "genre": "Keyboards",
      "image": "Artisit10.jpg",
      "district": "Colombo",
      "bio": "Blending modern synthesizers with classical compositions to create cinematic instrumental layers."
    },
    {
      "name": "Nimsara Nimesh",
      "genre": "Percussionist",
      "image": "Artisit12.jpg",
      "district": "Colombo",
      "bio": "Providing warm, resonant low-end support that serves as the foundation for the entire ensemble."
    }
  ]'::JSONB,
  '[
    {
      "name": "Chamuditha Galkaduwa",
      "genre": "Reviewer",
      "image": "Reviewer1.jpg",
      "district": "Gampaha",
      "bio": "intern Dental Surgeon, oral and maxillofacial Unit, District General Hospital, Gampaha"
    },
    {
      "name": "Ulindu Pasandul Lenaduwa Lokuge",
      "genre": "Reviewer",
      "image": "Reviewer2.jpg",
      "district": "Kandy",
      "bio": "An esteemed judge renowned for her deep appreciation of vocal artistry and ensemble performance."
    },
    {
      "name": "Dunya Kodithuwakki",
      "genre": "Reviewer",
      "image": "Reviewer3.jpg",
      "district": "Galle",
      "bio": "A celebrated musicologist specialising in South Asian classical traditions and fusion genres."
    },
    {
      "name": "W.A.Vijini Thisarani",
      "genre": "Reviewer",
      "image": "Reviewer4.jpg",
      "district": "Rathnapura",
      "bio": "A seasoned panel member with decades of experience evaluating orchestral and folk performances."
    },
    {
      "name": "W.Navodi Vindhya Waduge",
      "genre": "Reviewer",
      "image": "Reviewer5.jpg",
      "district": "Kegalle",
      "bio": "A passionate advocate for preserving traditional Sri Lankan instruments and indigenous musical forms."
    }
  ]'::JSONB
)
ON CONFLICT (id) DO UPDATE 
SET moderators = EXCLUDED.moderators,
    vocalists = EXCLUDED.vocalists,
    instrumentalists = EXCLUDED.instrumentalists,
    reviewers = EXCLUDED.reviewers;
