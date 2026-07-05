-- ============================================================================
-- Mind Ease Database Schema
-- PostgreSQL Database for AI-Powered Mental Health Platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- Stores user account information
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- USER PROFILES TABLE
-- Extended user information
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(50),
    location VARCHAR(255),
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER PREFERENCES TABLE
-- User settings and preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    mood_reminders BOOLEAN DEFAULT TRUE,
    weekly_insights BOOLEAN DEFAULT TRUE,
    content_recommendations BOOLEAN DEFAULT TRUE,
    
    -- Privacy preferences
    share_anonymous_data BOOLEAN DEFAULT FALSE,
    allow_analytics BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 30,
    
    -- Accessibility preferences
    font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    high_contrast BOOLEAN DEFAULT FALSE,
    reduce_motion BOOLEAN DEFAULT FALSE,
    screen_reader_optimized BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MOOD ENTRIES TABLE
-- Stores user mood tracking data
-- ============================================================================
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Mood data
    mood VARCHAR(50) NOT NULL CHECK (mood IN (
        'very_happy', 'happy', 'calm', 'neutral', 'tired',
        'anxious', 'stressed', 'sad', 'very_sad', 'energetic'
    )),
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    
    -- Additional context
    note TEXT,
    triggers TEXT[],
    activities TEXT[],
    
    -- Location and time context
    location VARCHAR(255),
    weather VARCHAR(100),
    time_of_day VARCHAR(20) CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_timestamp ON mood_entries(timestamp DESC);
CREATE INDEX idx_mood_entries_user_timestamp ON mood_entries(user_id, timestamp DESC);
CREATE INDEX idx_mood_entries_mood ON mood_entries(mood);

-- ============================================================================
-- CHAT SESSIONS TABLE
-- Stores chat session information
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_started_at ON chat_sessions(started_at DESC);

-- ============================================================================
-- CHAT MESSAGES TABLE
-- Stores all chat messages with AI
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- AI metadata
    model VARCHAR(100),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    
    -- Sentiment analysis
    sentiment_score DECIMAL(3,2),
    sentiment_label VARCHAR(50),
    emotions JSONB,
    
    -- Crisis detection
    is_crisis BOOLEAN DEFAULT FALSE,
    crisis_keywords TEXT[],
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_chat_messages_is_crisis ON chat_messages(is_crisis) WHERE is_crisis = TRUE;

-- ============================================================================
-- ANALYTICS DATA TABLE
-- Stores computed analytics for performance
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Period
    period VARCHAR(20) NOT NULL CHECK (period IN ('week', 'month', 'quarter', 'year')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Computed analytics (stored as JSONB for flexibility)
    mood_analytics JSONB NOT NULL,
    insights JSONB,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    UNIQUE(user_id, period, start_date)
);

-- Indexes
CREATE INDEX idx_analytics_user_period ON analytics_data(user_id, period);
CREATE INDEX idx_analytics_expires_at ON analytics_data(expires_at);

-- ============================================================================
-- RECOMMENDATIONS TABLE
-- Stores personalized content recommendations
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation details
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'article', 'video', 'exercise', 'meditation',
        'breathing', 'journaling', 'activity', 'resource'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_url TEXT,
    thumbnail_url TEXT,
    
    -- Relevance
    relevance_score DECIMAL(3,2),
    based_on_mood VARCHAR(50),
    tags TEXT[],
    
    -- Interaction tracking
    viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    liked BOOLEAN,
    completed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_viewed ON recommendations(viewed);

-- ============================================================================
-- USER ACTIVITIES TABLE
-- Tracks user engagement and activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp DESC);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);

-- ============================================================================
-- TRIGGERS TABLE
-- Stores identified triggers for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trigger details
    trigger_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    
    -- Statistics
    frequency INTEGER DEFAULT 1,
    average_impact DECIMAL(3,2),
    last_occurred TIMESTAMP WITH TIME ZONE,
    
    -- Trend analysis
    trend VARCHAR(20) CHECK (trend IN ('improving', 'stable', 'declining')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, trigger_name)
);

-- Indexes
CREATE INDEX idx_triggers_user_id ON triggers(user_id);
CREATE INDEX idx_triggers_frequency ON triggers(frequency DESC);

-- ============================================================================
-- COPING ACTIVITIES TABLE
-- Stores effective coping activities for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS coping_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    
    -- Effectiveness tracking
    times_used INTEGER DEFAULT 1,
    effectiveness_score DECIMAL(3,2),
    average_mood_improvement DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, activity_name)
);

-- Indexes
CREATE INDEX idx_coping_activities_user_id ON coping_activities(user_id);
CREATE INDEX idx_coping_activities_effectiveness ON coping_activities(effectiveness_score DESC);

-- ============================================================================
-- INSIGHTS TABLE
-- Stores AI-generated insights for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Insight details
    type VARCHAR(50) NOT NULL CHECK (type IN ('positive', 'warning', 'info', 'suggestion')),
    category VARCHAR(100),
    message TEXT NOT NULL,
    recommendation TEXT,
    
    -- Relevance
    confidence_score DECIMAL(3,2),
    priority INTEGER DEFAULT 0,
    
    -- User interaction
    viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    dismissed BOOLEAN DEFAULT FALSE,
    helpful BOOLEAN,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_viewed ON insights(viewed);

-- ============================================================================
-- AUDIT LOG TABLE
-- Tracks all important system events for security and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('success', 'failure', 'error')),
    error_message TEXT,
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_triggers_updated_at BEFORE UPDATE ON triggers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coping_activities_updated_at BEFORE UPDATE ON coping_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment chat session message count
CREATE OR REPLACE FUNCTION increment_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET message_count = message_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_message_count AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION increment_session_message_count();

-- Function to clean up expired analytics data
CREATE OR REPLACE FUNCTION cleanup_expired_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_data WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM recommendations WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM insights WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for user dashboard summary
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT me.id) as total_mood_entries,
    COUNT(DISTINCT cs.id) as total_chat_sessions,
    COUNT(DISTINCT cm.id) as total_messages,
    MAX(me.timestamp) as last_mood_entry,
    MAX(cm.timestamp) as last_chat_message
FROM users u
LEFT JOIN mood_entries me ON u.id = me.user_id
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id
GROUP BY u.id, u.name, u.email;

-- View for recent mood trends
CREATE OR REPLACE VIEW recent_mood_trends AS
SELECT 
    user_id,
    mood,
    intensity,
    timestamp,
    DATE_TRUNC('day', timestamp) as day,
    AVG(intensity) OVER (
        PARTITION BY user_id 
        ORDER BY timestamp 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_intensity
FROM mood_entries
WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY user_id, timestamp DESC;

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Insert default system user for automated messages
INSERT INTO users (id, email, name, password_hash, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@mindease.ai',
    'Mind Ease System',
    'SYSTEM_ACCOUNT',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mindease_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mindease_app;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Stores user account information and authentication data';
COMMENT ON TABLE mood_entries IS 'Tracks user mood entries with intensity, triggers, and activities';
COMMENT ON TABLE chat_messages IS 'Stores all chat conversations between users and AI assistant';
COMMENT ON TABLE analytics_data IS 'Cached analytics computations for performance optimization';
COMMENT ON TABLE triggers IS 'Identified triggers that affect user mental health';
COMMENT ON TABLE coping_activities IS 'Effective coping strategies tracked per user';
COMMENT ON TABLE insights IS 'AI-generated insights and recommendations for users';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
