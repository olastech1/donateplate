const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const campaigns = [
  {
    title: "Eco-Friendly Water Purification for Rural Communities",
    description: "Access to clean drinking water is a fundamental human right, yet millions still rely on unsafe sources. We are a team of engineers building a low-cost, solar-powered water purification system designed specifically for off-grid rural communities. Your support will help us manufacture the first 100 units to be deployed in drought-stricken regions across East Africa. Every dollar brings us closer to providing clean water and preventing waterborne diseases.",
    category: "community",
    goal_amount: 50000,
    current_amount: 12450,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1517409241977-10cecc045c79?q=80&w=1200&auto=format&fit=crop",
    status: "active",
    seo_visible: true
  },
  {
    title: "Help Sarah Beat Leukemia",
    description: "Sarah is a bright, energetic 7-year-old who was recently diagnosed with Acute Lymphoblastic Leukemia. Her parents have had to take unpaid leave to support her through aggressive chemotherapy sessions. The medical bills, combined with travel and living expenses, have become overwhelming. We are rallying together to raise funds so her family can focus entirely on her recovery without the crushing weight of financial stress.",
    category: "medical",
    goal_amount: 25000,
    current_amount: 8700,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1502747220144-846486e80891?q=80&w=1200&auto=format&fit=crop",
    status: "active",
    seo_visible: true
  },
  {
    title: "Next-Gen AI Tutor for Underprivileged Students",
    description: "Education should be a great equalizer, but quality tutoring is often too expensive for those who need it most. We are developing an advanced AI-powered tutoring app that adapts to each student's learning style and provides personalized, real-time feedback in subjects like Math and Science. The app will be completely free for students in low-income districts. We need funding to cover server costs and finalize the curriculum integration.",
    category: "education",
    goal_amount: 15000,
    current_amount: 14200,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    status: "active",
    seo_visible: true
  },
  {
    title: "Rebuilding 'The Daily Grind' Coffee Shop",
    description: "Last month, a devastating fire destroyed our beloved neighborhood coffee shop, 'The Daily Grind'. For 15 years, it was a gathering place for artists, students, and locals. Insurance only covers a portion of the structural damage, leaving us short on funds to replace our espresso machines, furniture, and inventory. We are asking our incredible community for help to rebuild and reopen our doors. Any contribution comes with free coffee for a month once we're back!",
    category: "general",
    goal_amount: 40000,
    current_amount: 450,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1200&auto=format&fit=crop",
    status: "active",
    seo_visible: true
  }
];

async function run() {
  try {
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'admin@donateplate.com' LIMIT 1");
    if (userRes.rows.length === 0) {
      console.log("Admin user not found, aborting.");
      return;
    }
    const creatorId = userRes.rows[0].id;
    console.log("Found admin ID:", creatorId);

    for (const c of campaigns) {
      await pool.query(
        `INSERT INTO campaigns 
         (creator_id, title, description, category, goal_amount, current_amount, deadline, cover_image_url, status, seo_visible)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [creatorId, c.title, c.description, c.category, c.goal_amount, c.current_amount, c.deadline, c.cover_image_url, c.status, c.seo_visible]
      );
      console.log("Inserted:", c.title);
    }

    console.log("All sample campaigns added successfully!");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
