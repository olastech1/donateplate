-- ============================================================
-- DONATEFATE — Migration v2: New Features
-- Adds: Comments, Reward Tiers, Recurring Donations, User Profiles
-- ============================================================

-- ============================================================
-- 1. COMMENTS TABLE
-- Threaded comments on campaigns from registered users.
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_campaign ON comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;


-- ============================================================
-- 2. REWARD TIERS TABLE
-- Campaign creators define reward tiers for donors.
-- ============================================================
CREATE TABLE IF NOT EXISTS reward_tiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    min_amount      DECIMAL(12, 2) NOT NULL CHECK (min_amount > 0),
    max_claims      INTEGER,  -- NULL = unlimited
    claimed_count   INTEGER NOT NULL DEFAULT 0,
    image_url       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_tiers_campaign ON reward_tiers(campaign_id);


-- ============================================================
-- 3. RECURRING DONATIONS TABLE
-- Stripe subscription-based recurring donations.
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_donations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id             UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount                  DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    frequency               VARCHAR(20) NOT NULL DEFAULT 'monthly'
                                CHECK (frequency IN ('weekly', 'monthly')),
    stripe_subscription_id  VARCHAR(255) UNIQUE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'paused', 'cancelled', 'failed')),
    next_charge_date        TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_recurring_campaign ON recurring_donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_status ON recurring_donations(status);


-- ============================================================
-- 4. EXTEND USERS TABLE — Profile fields
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_donated DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_campaigns_supported INTEGER NOT NULL DEFAULT 0;


-- ============================================================
-- 5. EXTEND DONATIONS TABLE — Reward tier + recurring flag
-- ============================================================
ALTER TABLE donations ADD COLUMN IF NOT EXISTS reward_tier_id UUID REFERENCES reward_tiers(id) ON DELETE SET NULL;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================
-- 6. UPDATE PLATFORM BRANDING
-- ============================================================
UPDATE platform_settings SET setting_value = 'DonateFate' WHERE setting_key = 'platform_name';
UPDATE platform_settings SET setting_value = 'support@donatefate.com' WHERE setting_key = 'support_email';


-- ============================================================
-- 7. TRIGGER: Auto-update user donation stats
-- When a donation succeeds, increment the donor's stats.
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_donation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') AND NEW.user_id IS NOT NULL THEN
        UPDATE users
        SET total_donated = total_donated + NEW.amount,
            total_campaigns_supported = (
                SELECT COUNT(DISTINCT campaign_id)
                FROM donations
                WHERE user_id = NEW.user_id AND status = 'success'
            )
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_user_donation_stats
    AFTER INSERT OR UPDATE OF status ON donations
    FOR EACH ROW EXECUTE FUNCTION update_user_donation_stats();
