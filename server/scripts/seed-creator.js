require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const CREATOR_EMAIL = 'creator@donatefate.com';
const CREATOR_PASSWORD = 'creator123';
const CREATOR_NAME = 'Test Creator';

async function seedCreator() {
  try {
    console.log('🔐 Hashing creator password...');
    const hash = await bcrypt.hash(CREATOR_PASSWORD, 12);

    console.log('📝 Creating/updating creator account...');
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, kyc_status)
       VALUES ($1, $2, $3, 'creator', 'not_submitted')
       ON CONFLICT (email) DO UPDATE SET password_hash = $3, kyc_status = 'not_submitted'
       RETURNING id, name, email, role, kyc_status`,
      [CREATOR_NAME, CREATOR_EMAIL, hash]
    );

    const creator = result.rows[0];
    console.log('\n✅ Creator account ready for KYC testing!');
    console.log(`   Email:      ${creator.email}`);
    console.log(`   Password:   ${CREATOR_PASSWORD}`);
    console.log(`   Role:       ${creator.role}`);
    console.log(`   KYC Status: ${creator.kyc_status}`);
    console.log(`   ID:         ${creator.id}\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedCreator();
