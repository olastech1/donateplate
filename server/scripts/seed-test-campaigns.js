/**
 * Seed 2 test campaigns into the database.
 * Usage: node scripts/seed-test-campaigns.js
 *
 * This script picks the first user in the DB as the campaign creator,
 * inserts two campaigns with status 'active', then exits.
 */
require('dotenv').config();
const pool = require('../config/db');

async function seed() {
  try {
    // Find a user to be the creator (pick the first creator or admin)
    const userResult = await pool.query(
      `SELECT id, name FROM users ORDER BY created_at ASC LIMIT 1`
    );

    if (userResult.rows.length === 0) {
      console.error('❌ No users found in the database. Register at least one user first.');
      process.exit(1);
    }

    const creator = userResult.rows[0];
    console.log(`Using creator: ${creator.name} (${creator.id})`);

    // Campaign 1 — Medical
    const c1 = await pool.query(
      `INSERT INTO campaigns (creator_id, title, description, cover_image_url, category, goal_amount, current_amount, status, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title`,
      [
        creator.id,
        'Help Sarah Fight Cancer',
        'Sarah is a 28-year-old teacher who was recently diagnosed with stage 2 breast cancer. She needs funds for chemotherapy, radiation therapy, and medication that her insurance doesn\'t fully cover. Every donation brings her one step closer to recovery. Sarah has been an incredible educator for 6 years, touching the lives of hundreds of students. Now it\'s our turn to help her. The treatment plan spans 8 months and includes 6 rounds of chemotherapy, followed by radiation therapy. Your generosity will cover hospital bills, medication costs, and help Sarah focus on healing without the burden of financial stress.',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
        'medical',
        25000.00,
        4750.00,
        'active',
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      ]
    );
    console.log(`✅ Campaign 1 created: "${c1.rows[0].title}" (${c1.rows[0].id})`);

    // Campaign 2 — Education
    const c2 = await pool.query(
      `INSERT INTO campaigns (creator_id, title, description, cover_image_url, category, goal_amount, current_amount, status, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title`,
      [
        creator.id,
        'Build a Library for Rural Kids',
        'Children in the rural village of Oakridge have no access to books or a library. We want to build a small community library that will serve over 200 children and their families. The library will include a reading room, a computer station with internet access, and a collection of over 2,000 books covering science, literature, history, and local culture. We\'ve already secured the land and have a team of volunteers ready to help with construction. Your donation will go directly toward building materials, books, furniture, and technology. Together, we can open doors of knowledge for an entire generation of children who deserve the chance to learn and dream big.',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
        'education',
        15000.00,
        2100.00,
        'active',
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      ]
    );
    console.log(`✅ Campaign 2 created: "${c2.rows[0].title}" (${c2.rows[0].id})`);

    console.log('\n🎉 Done! 2 test campaigns seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
