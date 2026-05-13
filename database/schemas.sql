-- ============================================================
-- SECURICLICK DATABASE SCHEMA v2
-- Ordre de création respecté (dépendances FK)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SCHOOLS  (aucune dépendance externe)
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    type                VARCHAR(50)  NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(20)  NOT NULL,
    address             TEXT         NOT NULL,
    city                VARCHAR(100) NOT NULL,
    postal_code         VARCHAR(10)  NOT NULL,
    manager_first_name  VARCHAR(100) NOT NULL,
    manager_last_name   VARCHAR(100) NOT NULL,
    manager_function    VARCHAR(100) NOT NULL,
    admin_user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active           BOOLEAN      DEFAULT true,
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW(),

    CONSTRAINT schools_admin_user_id_unique UNIQUE(admin_user_id)
);

-- ============================================================
-- 2. USER_PROFILES  (référence schools — donc après)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    avatar_url  TEXT,
    role        VARCHAR(20)  NOT NULL
                    CHECK (role IN ('parent', 'collector', 'staff', 'school_admin', 'super_admin')),
    school_id   UUID         REFERENCES schools(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW(),

    CONSTRAINT user_profiles_user_id_unique UNIQUE(user_id)
);

-- ============================================================
-- 3. SCHOOL_MEMBERSHIPS  (référence schools + auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS school_memberships (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id  UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'school_admin')),
    is_active  BOOLEAN     DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT school_memberships_school_user_unique UNIQUE(school_id, user_id)
);

-- ============================================================
-- 4. CHILDREN  (référence auth.users + schools)
--    school_id nullable : parent peut ajouter un enfant
--    avant de le rattacher à une école
-- ============================================================
CREATE TABLE IF NOT EXISTS children (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id     UUID         REFERENCES schools(id) ON DELETE SET NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    date_of_birth DATE         NOT NULL,
    photo_url     TEXT,
    class_name    VARCHAR(100),
    medical_notes TEXT,
    is_active     BOOLEAN      DEFAULT true,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 5. GUARDIANS  (personnes autorisées à récupérer)
--    Contrainte UNIQUE supprimée : un parent peut avoir
--    plusieurs gardiens pour le même enfant (grand-mère,
--    oncle, ami, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS guardians (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id     UUID         NOT NULL REFERENCES children(id)   ON DELETE CASCADE,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(255),
    relationship VARCHAR(50)  NOT NULL,
    photo_url    TEXT,
    priority     INTEGER      DEFAULT 1,
    is_active    BOOLEAN      DEFAULT true,
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 6. PICKUP_AUTHORIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS pickup_authorizations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id     UUID        NOT NULL REFERENCES children(id)   ON DELETE CASCADE,
    guardian_id  UUID        REFERENCES guardians(id)           ON DELETE CASCADE,
    monday       BOOLEAN     DEFAULT false,
    tuesday      BOOLEAN     DEFAULT false,
    wednesday    BOOLEAN     DEFAULT false,
    thursday     BOOLEAN     DEFAULT false,
    friday       BOOLEAN     DEFAULT false,
    start_time   TIME        DEFAULT '15:00:00',
    end_time     TIME        DEFAULT '18:00:00',
    is_active    BOOLEAN     DEFAULT true,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. INVITED_COLLECTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS invited_collectors (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id   UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id    UUID         REFERENCES children(id) ON DELETE SET NULL,
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    phone       VARCHAR(20),
    used        BOOLEAN      DEFAULT false,
    used_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 8. QR_CODES
--    guardian_id ajouté : sait pour qui le QR a été généré
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id   UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id    UUID         NOT NULL REFERENCES children(id)   ON DELETE CASCADE,
    guardian_id UUID         REFERENCES guardians(id)           ON DELETE SET NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_used     BOOLEAN      DEFAULT false,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 9. PICKUP_LOGS
--    staff_id ajouté : traçabilité de qui a validé
--    scanned_by_collector_id : si c'est un collecteur invité
-- ============================================================
CREATE TABLE IF NOT EXISTS pickup_logs (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id               UUID         NOT NULL REFERENCES children(id)  ON DELETE CASCADE,
    guardian_id            UUID         REFERENCES guardians(id)           ON DELETE SET NULL,
    qr_code_id             UUID         REFERENCES qr_codes(id)            ON DELETE SET NULL,
    staff_id               UUID         REFERENCES auth.users(id)          ON DELETE SET NULL,
    pickup_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status                 VARCHAR(20)  NOT NULL
                               CHECK (status IN ('completed', 'denied', 'cancelled')),
    denial_reason          TEXT,
    notes                  TEXT,
    created_at             TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id   ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role      ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_id ON user_profiles(school_id);

CREATE INDEX IF NOT EXISTS idx_schools_admin_user_id   ON schools(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_schools_email           ON schools(email);

CREATE INDEX IF NOT EXISTS idx_school_memberships_school_id ON school_memberships(school_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_user_id   ON school_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_role      ON school_memberships(role);
CREATE INDEX IF NOT EXISTS idx_school_memberships_is_active ON school_memberships(is_active);

CREATE INDEX IF NOT EXISTS idx_children_parent_id   ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_school_id   ON children(school_id);
CREATE INDEX IF NOT EXISTS idx_children_is_active   ON children(is_active);

CREATE INDEX IF NOT EXISTS idx_guardians_parent_id  ON guardians(parent_id);
CREATE INDEX IF NOT EXISTS idx_guardians_child_id   ON guardians(child_id);
CREATE INDEX IF NOT EXISTS idx_guardians_is_active  ON guardians(is_active);

CREATE INDEX IF NOT EXISTS idx_pickup_auth_parent_id   ON pickup_authorizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_pickup_auth_child_id    ON pickup_authorizations(child_id);
CREATE INDEX IF NOT EXISTS idx_pickup_auth_guardian_id ON pickup_authorizations(guardian_id);
CREATE INDEX IF NOT EXISTS idx_pickup_auth_is_active   ON pickup_authorizations(is_active);

CREATE INDEX IF NOT EXISTS idx_invited_collectors_parent_id  ON invited_collectors(parent_id);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_email      ON invited_collectors(email);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_token      ON invited_collectors(token);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_used       ON invited_collectors(used);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_expires_at ON invited_collectors(expires_at);

CREATE INDEX IF NOT EXISTS idx_qr_codes_parent_id   ON qr_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_child_id    ON qr_codes(child_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_guardian_id ON qr_codes(guardian_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token       ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at  ON qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_used     ON qr_codes(is_used);

CREATE INDEX IF NOT EXISTS idx_pickup_logs_child_id    ON pickup_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_guardian_id ON pickup_logs(guardian_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_staff_id    ON pickup_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_status      ON pickup_logs(status);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_pickup_time ON pickup_logs(pickup_time);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_own_all" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_school_admin_select" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            WHERE sm.user_id = auth.uid()
              AND sm.school_id = user_profiles.school_id
              AND sm.role = 'school_admin'
              AND sm.is_active = true
        )
    );

-- schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_admin_all" ON schools
    FOR ALL USING (admin_user_id = auth.uid());

CREATE POLICY "schools_member_select" ON schools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            WHERE sm.user_id = auth.uid()
              AND sm.school_id = schools.id
              AND sm.is_active = true
        )
    );

-- school_memberships
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_memberships_own_select" ON school_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "school_memberships_admin_all" ON school_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm2
            WHERE sm2.user_id = auth.uid()
              AND sm2.school_id = school_memberships.school_id
              AND sm2.role = 'school_admin'
              AND sm2.is_active = true
        )
    );

-- children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "children_parent_all" ON children
    FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "children_school_staff_select" ON children
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            WHERE sm.user_id = auth.uid()
              AND sm.school_id = children.school_id
              AND sm.role IN ('staff', 'school_admin')
              AND sm.is_active = true
        )
    );

-- guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardians_parent_all" ON guardians
    FOR ALL USING (parent_id = auth.uid());

-- pickup_authorizations
ALTER TABLE pickup_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pickup_auth_parent_all" ON pickup_authorizations
    FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "pickup_auth_staff_select" ON pickup_authorizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children c
            JOIN school_memberships sm ON sm.school_id = c.school_id
            WHERE c.id = pickup_authorizations.child_id
              AND sm.user_id = auth.uid()
              AND sm.role IN ('staff', 'school_admin')
              AND sm.is_active = true
        )
    );

-- invited_collectors
ALTER TABLE invited_collectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invited_collectors_parent_all" ON invited_collectors
    FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "invited_collectors_token_select" ON invited_collectors
    FOR SELECT USING (used = false AND expires_at > NOW());

-- qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qr_codes_parent_all" ON qr_codes
    FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "qr_codes_staff_select" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children c
            JOIN school_memberships sm ON sm.school_id = c.school_id
            WHERE c.id = qr_codes.child_id
              AND sm.user_id = auth.uid()
              AND sm.role IN ('staff', 'school_admin')
              AND sm.is_active = true
        )
    );

-- pickup_logs
ALTER TABLE pickup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pickup_logs_parent_select" ON pickup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children c
            WHERE c.id = pickup_logs.child_id
              AND c.parent_id = auth.uid()
        )
    );

CREATE POLICY "pickup_logs_staff_all" ON pickup_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM children c
            JOIN school_memberships sm ON sm.school_id = c.school_id
            WHERE c.id = pickup_logs.child_id
              AND sm.user_id = auth.uid()
              AND sm.role IN ('staff', 'school_admin')
              AND sm.is_active = true
        )
    );

CREATE POLICY "pickup_logs_staff_insert" ON pickup_logs
    FOR INSERT WITH CHECK (staff_id = auth.uid());

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_school_memberships_updated_at
    BEFORE UPDATE ON school_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_children_updated_at
    BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_guardians_updated_at
    BEFORE UPDATE ON guardians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pickup_authorizations_updated_at
    BEFORE UPDATE ON pickup_authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER auto-inscription school_admin dans school_memberships
-- Quand une école est créée, l'admin est automatiquement
-- ajouté comme school_admin dans school_memberships
-- ============================================================

CREATE OR REPLACE FUNCTION auto_add_school_admin_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO school_memberships (school_id, user_id, role, is_active)
    VALUES (NEW.id, NEW.admin_user_id, 'school_admin', true)
    ON CONFLICT (school_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_school_admin_membership
    AFTER INSERT ON schools
    FOR EACH ROW EXECUTE FUNCTION auto_add_school_admin_membership();
