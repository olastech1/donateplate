const pool = require('./server/config/db');
async function run() {
  try {
    const result = await pool.query('UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE');
    console.log(`Updated ${result.rowCount} users.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
