INSERT INTO platform_settings (setting_key, setting_value, is_encrypted, description)
VALUES ('require_email_verification', 'true', FALSE, 'Require users to verify their email before logging in')
ON CONFLICT (setting_key) DO NOTHING;
