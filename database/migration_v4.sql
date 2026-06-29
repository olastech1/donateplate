-- Seed default pages if they do not exist
INSERT INTO platform_settings (setting_key, setting_value, is_encrypted, description)
VALUES 
  ('page_about_us', '<h2>About Us</h2><p>Welcome to our platform!</p>', FALSE, 'About Us Page Content'),
  ('page_contact', '<h2>Contact Us</h2><p>Email us at support@donateplate.com</p>', FALSE, 'Contact Page Content'),
  ('page_privacy_policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us.</p>', FALSE, 'Privacy Policy Page Content'),
  ('page_terms_conditions', '<h2>Terms and Conditions</h2><p>By using this platform, you agree to these terms.</p>', FALSE, 'Terms and Conditions Content'),
  ('page_refund_policy', '<h2>Refund Policy</h2><p>Refunds are subject to our verification process.</p>', FALSE, 'Refund Policy Content')
ON CONFLICT DO NOTHING;
