-- ========================================
-- SECURICLICK DATABASE SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- USERS TABLE (extends Supabase auth.users)
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'collector', 'staff', 'school_admin', 'super_admin')),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT user_profiles_user_id_unique UNIQUE(user_id)
);

-- ========================================
-- SCHOOLS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    manager_first_name VARCHAR(100) NOT NULL,
    manager_last_name VARCHAR(100) NOT NULL,
    manager_function VARCHAR(100) NOT NULL,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT schools_admin_user_id_unique UNIQUE(admin_user_id)
);

-- ========================================
-- CHILDREN TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    photo_url TEXT,
    medical_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GUARDIANS TABLE (Authorized pickup persons)
-- ========================================
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    relationship VARCHAR(50) NOT NULL, -- 'grandparent', 'uncle', 'friend', etc.
    priority INTEGER DEFAULT 1, -- 1=primary, 2=secondary, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT guardians_parent_child_unique UNIQUE(parent_id, child_id)
);

-- ========================================
-- PICKUP AUTHORIZATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS pickup_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    monday BOOLEAN DEFAULT false,
    tuesday BOOLEAN DEFAULT false,
    wednesday BOOLEAN DEFAULT false,
    thursday BOOLEAN DEFAULT false,
    friday BOOLEAN DEFAULT false,
    start_time TIME DEFAULT '15:00:00',
    end_time TIME DEFAULT '18:00:00',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- QR CODES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    qr_image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PICKUP LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS pickup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
    pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'denied', 'cancelled')),
    reason TEXT, -- Reason for denial if applicable
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INVITED COLLECTORS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS invited_collectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SCHOOL MEMBERSHIPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS school_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'school_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT school_memberships_school_user_unique UNIQUE(school_id, user_id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_id ON user_profiles(school_id);

CREATE INDEX IF NOT EXISTS idx_schools_admin_user_id ON schools(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_school_id ON children(school_id);
CREATE INDEX IF NOT EXISTS idx_children_is_active ON children(is_active);

CREATE INDEX IF NOT EXISTS idx_guardians_parent_id ON guardians(parent_id);
CREATE INDEX IF NOT EXISTS idx_guardians_child_id ON guardians(child_id);
CREATE INDEX IF NOT EXISTS idx_guardians_is_active ON guardians(is_active);

CREATE INDEX IF NOT EXISTS idx_pickup_authorizations_parent_id ON pickup_authorizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_pickup_authorizations_child_id ON pickup_authorizations(child_id);
CREATE INDEX IF NOT EXISTS idx_pickup_authorizations_guardian_id ON pickup_authorizations(guardian_id);
CREATE INDEX IF NOT EXISTS idx_pickup_authorizations_is_active ON pickup_authorizations(is_active);

CREATE INDEX IF NOT EXISTS idx_qr_codes_parent_id ON qr_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_child_id ON qr_codes(child_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_used ON qr_codes(is_used);

CREATE INDEX IF NOT EXISTS idx_pickup_logs_child_id ON pickup_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_guardian_id ON pickup_logs(guardian_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_pickup_time ON pickup_logs(pickup_time);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_status ON pickup_logs(status);

CREATE INDEX IF NOT EXISTS idx_invited_collectors_parent_id ON invited_collectors(parent_id);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_email ON invited_collectors(email);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_token ON invited_collectors(token);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_used ON invited_collectors(used);
CREATE INDEX IF NOT EXISTS idx_invited_collectors_expires_at ON invited_collectors(expires_at);

CREATE INDEX IF NOT EXISTS idx_school_memberships_school_id ON school_memberships(school_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_user_id ON school_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_role ON school_memberships(role);
CREATE INDEX IF NOT EXISTS idx_school_memberships_is_active ON school_memberships(is_active);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Users can see their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- School admins can view profiles of users in their school
CREATE POLICY "School admins can view school profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM school_memberships 
            WHERE school_memberships.user_id = auth.uid()
            AND school_memberships.school_id = user_profiles.school_id
            AND school_memberships.role = 'school_admin'
            AND school_memberships.is_active = true
        )
    );

-- Parents can view guardians for their children
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their children guardians" ON guardians
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.parent_id = auth.uid()
            AND guardians.child_id = children.id
        )
    );

-- Parents can manage their children's guardians
CREATE POLICY "Parents can manage their children guardians" ON guardians
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.parent_id = auth.uid()
            AND guardians.child_id = children.id
        )
    );

-- Parents can view their children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their children" ON children
    FOR ALL USING (parent_id = auth.uid());

-- Parents can manage their children
CREATE POLICY "Parents can manage their children" ON children
    FOR ALL USING (parent_id = auth.uid());

-- School staff can view children in their school
CREATE POLICY "School staff can view school children" ON children
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM school_memberships 
            WHERE school_memberships.user_id = auth.uid()
            AND school_memberships.school_id = children.school_id
            AND school_memberships.role IN ('staff', 'school_admin')
            AND school_memberships.is_active = true
        )
    );

-- QR codes access based on parent/child relationship
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their QR codes" ON qr_codes
    FOR ALL USING (parent_id = auth.uid());

-- Parents can manage their QR codes
CREATE POLICY "Parents can manage their QR codes" ON qr_codes
    FOR ALL USING (parent_id = auth.uid());

-- Pickup logs access
ALTER TABLE pickup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their children pickup logs" ON pickup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.parent_id = auth.uid()
            AND pickup_logs.child_id = children.id
        )
    );

-- Guardians can view pickup logs for children they pickup
CREATE POLICY "Guardians can view their pickup logs" ON pickup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guardians 
            WHERE guardians.id = pickup_logs.guardian_id
            AND guardians.parent_id = auth.uid()
        )
    );

-- School staff can view pickup logs for children in their school
CREATE POLICY "School staff can view school pickup logs" ON pickup_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.school_id = (
                SELECT school_id FROM school_memberships 
                WHERE school_memberships.user_id = auth.uid()
                AND school_memberships.role IN ('staff', 'school_admin')
                AND school_memberships.is_active = true
                LIMIT 1
            )
            AND pickup_logs.child_id = children.id
        )
    );

-- Schools access for admins
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins can view their school" ON schools
    FOR ALL USING (admin_user_id = auth.uid());

-- School memberships access
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their school memberships" ON school_memberships
    FOR SELECT USING (user_id = auth.uid());

-- School admins can manage school memberships
CREATE POLICY "School admins can manage school memberships" ON school_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm2
            WHERE sm2.user_id = auth.uid()
            AND sm2.school_id = school_memberships.school_id
            AND sm2.role = 'school_admin'
            AND sm2.is_active = true
        )
    );

-- Invited collectors access
ALTER TABLE invited_collectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can manage their invited collectors" ON invited_collectors
    FOR ALL USING (parent_id = auth.uid());

-- ========================================
-- TRIGGERS FOR AUDIT
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pickup_authorizations_updated_at BEFORE UPDATE ON pickup_authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_memberships_updated_at BEFORE UPDATE ON school_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
