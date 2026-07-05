-- Initial database schema for AI-Powered Mental Health Website
-- Creates tables for users, messages, mood entries, chat sessions, and content

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  location VARCHAR(255),
  timezone VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system',
  
  -- Notification preferences (stored as JSONB for flexibility)
  notifications JSONB DEFAULT '{"email": true, "push": false, "moodReminders": true, "weeklyInsights": true, "contentRecommendations": true}'::jsonb,
  
  -- Privacy preferences
  privacy JSONB DEFAULT '{"shareAnonymousData": false, "allowAnalytics": true, "dataRetentionDays": 365}'::jsonb,
  
  -- Accessibility preferences
  accessibility JSONB DEFAULT '{"fontSize": "medium", "highContrast": false, "reduceMotion": false, "screenReaderOptimized": false}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  average_sentiment DECIMAL(3, 2),
  dominant_mood VARCHAR(50),
  topics TEXT[],
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'error')),
  
  -- Metadata stored as JSONB
  metadata JSONB,
  
  -- Sentiment analysis
  sentiment_score DECIMAL(3, 2),
  sentiment_comparative DECIMAL(5, 4),
  sentiment_tokens TEXT[],
  sentiment_positive TEXT[],
  sentiment_negative TEXT[],
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mood entries table (optimized for time-series queries)
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('positive', 'neutral', 'negative', 'anxious')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  note TEXT,
  triggers TEXT[],
  activities TEXT[],
  
  -- Context information
  context_time_of_day VARCHAR(20) CHECK (context_time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  context_location VARCHAR(255),
  context_weather VARCHAR(100),
  context_social_context VARCHAR(50) CHECK (context_social_context IN ('alone', 'with_friends', 'with_family', 'at_work')),
  context_physical_state TEXT[],
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content recommendations table (for future use)
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('article', 'exercise', 'video', 'audio', 'resource')),
  category VARCHAR(100),
  tags TEXT[],
  url TEXT,
  content_body TEXT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User content interactions (for recommendation engine)
CREATE TABLE IF NOT EXISTS user_content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'like', 'save', 'complete', 'share')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, content_id, interaction_type, timestamp)
);

-- Create indexes for performance

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Chat session indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);
CREATE INDEX idx_chat_sessions_is_active ON chat_sessions(is_active);

-- Message indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_role ON messages(role);

-- Mood entry indexes (optimized for time-series queries)
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_timestamp ON mood_entries(timestamp DESC);
CREATE INDEX idx_mood_entries_user_timestamp ON mood_entries(user_id, timestamp DESC);
CREATE INDEX idx_mood_entries_category ON mood_entries(category);
CREATE INDEX idx_mood_entries_mood ON mood_entries(mood);

-- Content indexes
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_category ON content(category);
CREATE INDEX idx_content_tags ON content USING GIN(tags);

-- User content interaction indexes
CREATE INDEX idx_user_content_interactions_user_id ON user_content_interactions(user_id);
CREATE INDEX idx_user_content_interactions_content_id ON user_content_interactions(content_id);
CREATE INDEX idx_user_content_interactions_timestamp ON user_content_interactions(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for user analytics
CREATE OR REPLACE VIEW user_mood_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_entries,
  AVG(intensity) as average_intensity,
  MODE() WITHIN GROUP (ORDER BY mood) as dominant_mood,
  MODE() WITHIN GROUP (ORDER BY category) as dominant_category,
  MIN(timestamp) as first_entry,
  MAX(timestamp) as last_entry
FROM mood_entries
GROUP BY user_id;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
