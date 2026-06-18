/**
 * scripts/migrateEventDetails.js
 * Migrates events table to add columns for moderators, vocalists, instrumentalists, and reviewers.
 * Seeds database with all details and images.
 */

'use strict';

const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Running migrations...');
    
    // Add columns if they do not exist
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS moderators JSONB DEFAULT '[]'::JSONB,
      ADD COLUMN IF NOT EXISTS vocalists JSONB DEFAULT '[]'::JSONB,
      ADD COLUMN IF NOT EXISTS instrumentalists JSONB DEFAULT '[]'::JSONB,
      ADD COLUMN IF NOT EXISTS reviewers JSONB DEFAULT '[]'::JSONB;
    `);
    console.log('✅ Columns added (or already existed).');

    // Data to seed
    const moderators = [
      {
        name: 'Chamindu Gamage',
        genre: 'Master of Ceremonies',
        image: 'Moderor.jpg',
        district: 'Kegalle',
        bio: 'An elegant presenter and seasoned host, guiding the festival through smooth transitions and immersive storytelling.'
      }
    ];

    const reviewers = [
      {
        name: 'Chamuditha Galkaduwa',
        genre: 'Reviewer',
        image: 'Reviewer1.jpg',
        district: 'Gampaha',
        bio: 'intern Dental Surgeon, oral and maxillofacial Unit, District General Hospital, Gampaha'
      },
      {
        name: 'Ulindu Pasandul Lenaduwa Lokuge',
        genre: 'Reviewer',
        image: 'Reviewer2.jpg',
        district: 'Kandy',
        bio: 'An esteemed judge renowned for her deep appreciation of vocal artistry and ensemble performance.'
      },
      {
        name: 'Dunya Kodithuwakki',
        genre: 'Reviewer',
        image: 'Reviewer3.jpg',
        district: 'Galle',
        bio: 'A celebrated musicologist specialising in South Asian classical traditions and fusion genres.'
      },
      {
        name: 'W.A.Vijini Thisarani',
        genre: 'Reviewer',
        image: 'Reviewer4.jpg',
        district: 'Rathnapura',
        bio: 'A seasoned panel member with decades of experience evaluating orchestral and folk performances.'
      },
      {
        name: 'W.Navodi Vindhya Waduge',
        genre: 'Reviewer',
        image: 'Reviewer5.jpg',
        district: 'Kegalle',
        bio: 'A passionate advocate for preserving traditional Sri Lankan instruments and indigenous musical forms.'
      }
    ];

    const vocalists = [
      {
        name: 'Sasanda Sankalana',
        genre: 'Vocalist',
        image: 'Artisit6.jpg',
        district: 'Kandy',
        bio: 'A legendary vocal artist, celebrated for his profound classical roots and expressive, soul-stirring melodies.'
      },
      {
        name: 'Devindi Rajapaksha',
        genre: 'Vocalist',
        image: 'Artisit8.jpg',
        district: 'Kegalle',
        bio: 'An avant-garde composer and singer, blending deep acoustic textures with traditional Sri Lankan folk music.'
      },
      {
        name: 'Hashara Sandamini',
        genre: 'Vocalist',
        image: 'Artisit9.jpg',
        district: 'Rathnapura',
        bio: 'A powerhouse vocalist whose versatility spans classical opera to high-energy contemporary fusion.'
      },
      {
        name: 'Buddhima Prasad Priyanath',
        genre: 'Vocalist',
        image: 'Artisit5.jpg',
        district: 'Rathnapura',
        bio: 'A rhythm specialist whose rapid-fire classical beats define the tempo of the performance.'
      }
    ];

    const instrumentalists = [
      {
        name: 'Malshan Ranawella',
        genre: 'Vocalist, Violinist',
        image: 'Artisit11.jpg',
        district: 'Badulla',
        bio: 'Project Manager, Altria Consulting(Pvt) Ltd Vocalist, violinist'
      },
      {
        name: 'Punsarani Anodya',
        genre: 'Violinist',
        image: 'Artisit1.jpeg',
        district: 'Colombo',
        bio: 'Renowned for his precise, classical techniques and contribution to local orchestral fusion projects.'
      },
      {
        name: 'Methnal Liyanage',
        genre: 'Flutist',
        image: 'Artisit2.jpeg',
        district: 'Galle',
        bio: 'Captivating listeners with serene traditional ragas and innovative classical interpretations.'
      },
      {
        name: 'Ravindu Dileepa',
        genre: 'Lead Guitarist',
        image: 'Artisit3.jpeg',
        district: 'Rathnapura',
        bio: 'A dynamic percussionist specializing in traditional Sri Lankan low-country and up-country drumming.'
      },
      {
        name: 'Rasindu Karunathilaka',
        genre: 'Lead Guitarist',
        image: 'Artisit4.jpeg',
        district: 'Rathnapura',
        bio: 'Crafting atmospheric soundscapes using classical wooden flutes and modern wind fusion styles.'
      },
      {
        name: 'Minhaj Ali',
        genre: 'Keyboards',
        image: 'Artisit10.jpg',
        district: 'Colombo',
        bio: 'Blending modern synthesizers with classical compositions to create cinematic instrumental layers.'
      },
      {
        name: 'Nimsara Nimesh',
        genre: 'Percussionist',
        image: 'Artisit12.jpg',
        district: 'Colombo',
        bio: 'Providing warm, resonant low-end support that serves as the foundation for the entire ensemble.'
      }
    ];

    console.log('Seeding event details...');
    await pool.query(
      `UPDATE events 
       SET moderators = $1, 
           vocalists = $2, 
           instrumentalists = $3, 
           reviewers = $4 
       WHERE id = 1`,
      [
        JSON.stringify(moderators),
        JSON.stringify(vocalists),
        JSON.stringify(instrumentalists),
        JSON.stringify(reviewers)
      ]
    );

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

run();
