const { Pool } = require('pg');

const activePool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_IcW2mM1Rtkux@ep-lively-heart-aqdfzbki-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

const oldUsers = [
  {
    id: '872a2200-f01e-450e-8b9a-4f5b765b005f',
    name: 'admin',
    email: 'admin@donateplate.com',
    password_hash: '$2b$12$TK7IuOkg1n0agoXSfsU7qeNuE.q6tRPTGwESdn5z.eucF6wz5AaH6',
    role: 'admin',
    email_verified: true
  },
  {
    id: '7b041734-7a61-4799-b8fa-f9737e5fe447',
    name: 'Olaniyi',
    email: 'hi@olaniyi.me',
    password_hash: '$2b$12$ZPUL.NTYKAt2BfwfreODwuuHKQeJJULw0dWPasiS1MNWMNcCfbsj.',
    role: 'creator',
    email_verified: true
  }
];

async function run() {
  try {
    for (const user of oldUsers) {
      // Check if user exists by email
      const res = await activePool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (res.rows.length > 0) {
        // Update password and role
        console.log(`Updating existing user: ${user.email}`);
        await activePool.query(
          'UPDATE users SET password_hash = $1, role = $2, email_verified = true WHERE email = $3',
          [user.password_hash, user.role, user.email]
        );
      } else {
        // Insert new user
        console.log(`Inserting new user: ${user.email}`);
        await activePool.query(
          'INSERT INTO users (id, name, email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, user.name, user.email, user.password_hash, user.role, user.email_verified]
        );
      }
    }
    console.log('Done!');
  } catch(e) {
    console.error(e);
  } finally {
    await activePool.end();
  }
}

run();
