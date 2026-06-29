const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const pages = {
  page_about_us: `
    <h2>About DonateFate</h2>
    <p>Welcome to <strong>DonateFate</strong>, a vibrant crowdfunding platform dedicated to empowering dreams, one campaign at a time.</p>
    
    <h3>Our Mission</h3>
    <p>Our mission is simple: to connect passionate creators, innovators, and changemakers with a global community of supporters who believe in their vision. We believe that everyone deserves a chance to bring their ideas to life, whether it's launching a groundbreaking startup, supporting a community initiative, or overcoming personal challenges.</p>

    <h3>Why Choose Us?</h3>
    <ul>
      <li><strong>Verified Campaigns:</strong> We prioritize trust and transparency. Every creator goes through a rigorous KYC (Know Your Customer) process before they can withdraw funds.</li>
      <li><strong>Secure Donations:</strong> Backed by industry-leading encryption and powered by Stripe, your payments are always safe.</li>
      <li><strong>Global Reach:</strong> Support campaigns from anywhere in the world and make an impact beyond borders.</li>
    </ul>

    <p>Join us on our journey to make fundraising accessible, secure, and transparent for everyone.</p>
  `,
  
  page_contact: `
    <h2>Contact Support</h2>
    <p>We are here to help you! Whether you have a question about a campaign, need help with your account, or want to report an issue, our support team is ready to assist.</p>
    
    <h3>Get in Touch</h3>
    <p><strong>Email Support:</strong> <br />
    Reach out to us anytime at <a href="mailto:support@donatefate.com">support@donatefate.com</a>. We aim to respond to all inquiries within 24-48 hours.</p>

    <p><strong>Business Inquiries:</strong> <br />
    For partnerships and press inquiries, please email <a href="mailto:business@donatefate.com">business@donatefate.com</a>.</p>
    
    <h3>Working Hours</h3>
    <p>Monday - Friday: 9:00 AM - 6:00 PM (EST)<br />
    Saturday - Sunday: Closed</p>
  `,

  page_terms_conditions: `
    <h2>Terms and Conditions</h2>
    <p><strong>Last Updated: June 2026</strong></p>

    <h3>1. Acceptance of Terms</h3>
    <p>By accessing or using the DonateFate platform, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, please do not use our services.</p>

    <h3>2. Use of the Platform</h3>
    <p>DonateFate is a platform designed to facilitate donations to verified campaigns. We are not a broker, financial institution, or charity. While we enforce strict KYC policies for creators, we do not guarantee the accuracy of campaign claims.</p>

    <h3>3. Campaign Creation & KYC</h3>
    <p>Users creating campaigns ("Creators") must provide accurate personal and banking information. Funds will not be disbursed until identity verification is complete. Misrepresentation of identity or campaign goals will result in immediate account termination, fund forfeiture, and potential legal action.</p>

    <h3>4. Donations</h3>
    <p>All donations made on the platform are strictly voluntary. Donors understand that they are supporting a campaign at their own risk. A platform fee may be deducted from donations to cover payment processing and operational costs.</p>

    <h3>5. Platform Rights</h3>
    <p>We reserve the right to suspend or terminate campaigns, freeze funds, or ban users who violate our community guidelines or engage in fraudulent activities.</p>
  `,

  page_refund_policy: `
    <h2>Refund Policy</h2>
    <p><strong>Last Updated: June 2026</strong></p>

    <h3>1. General Refund Policy</h3>
    <p>Because donations are typically disbursed to campaign creators to fund their projects, all donations made on DonateFate are generally considered final and non-refundable.</p>

    <h3>2. Fraud and Unauthorized Transactions</h3>
    <p>In the event of a proven fraudulent campaign, or if a transaction was made using your payment method without your authorization, we will work with our payment processor (Stripe) to investigate the issue. If funds have not yet been withdrawn by the creator, we will issue a full refund to affected donors.</p>

    <h3>3. Requesting a Refund</h3>
    <p>If you made a mistake (e.g., donating $100 instead of $10), you may request a refund within <strong>24 hours</strong> of the transaction by contacting our support team at <a href="mailto:support@donatefate.com">support@donatefate.com</a>. Please note that refunds cannot be issued if the campaign creator has already withdrawn the funds.</p>

    <h3>4. Processing Times</h3>
    <p>Approved refunds may take 5-10 business days to appear on your bank statement, depending on your financial institution.</p>
  `
};

async function run() {
  try {
    for (const [key, content] of Object.entries(pages)) {
      await pool.query(
        `UPDATE platform_settings SET setting_value = $1 WHERE setting_key = $2`,
        [content.trim(), key]
      );
      console.log(`Updated ${key}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
