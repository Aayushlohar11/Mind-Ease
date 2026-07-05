# Database Setup Guide

This guide will help you set up the PostgreSQL database for Mind Ease.

## Prerequisites

- PostgreSQL 14+ installed
- Node.js 18+ installed
- Database credentials

## Quick Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE mindease_db;

# Create user (optional)
CREATE USER mindease_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mindease_db TO mindease_user;

# Exit
\q
```

### 3. Run Schema Migration

```bash
# From project root
psql -U postgres -d mindease_db -f database/schema.sql

# Or with custom user
psql -U mindease_user -d mindease_db -f database/schema.sql
```

### 4. Configure Environment Variables

Update `.env.local`:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://mindease_user:your_secure_password@localhost:5432/mindease_db

# Or individual settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mindease_db
DB_USER=mindease_user
DB_PASSWORD=your_secure_password

# Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# SSL (false for local, true for production)
DB_SSL=false
```

### 5. Test Connection

```bash
npm run db:test
```

## Database Schema Overview

### Core Tables

1. **users** - User accounts and authentication
2. **user_profiles** - Extended user information
3. **user_preferences** - User settings and preferences
4. **mood_entries** - Mood tracking data
5. **chat_sessions** - Chat conversation sessions
6. **chat_messages** - Individual chat messages
7. **analytics_data** - Cached analytics computations
8. **recommendations** - Personalized content suggestions
9. **triggers** - Identified mental health triggers
10. **coping_activities** - Effective coping strategies
11. **insights** - AI-generated insights
12. **user_activities** - User engagement tracking
13. **audit_logs** - Security and debugging logs

### Relationships

```
users (1) ──→ (N) mood_entries
users (1) ──→ (N) chat_sessions
users (1) ──→ (N) chat_messages
users (1) ──→ (1) user_profiles
users (1) ──→ (1) user_preferences
users (1) ──→ (N) triggers
users (1) ──→ (N) coping_activities
users (1) ──→ (N) insights
users (1) ──→ (N) recommendations

chat_sessions (1) ──→ (N) chat_messages
```

## Database Maintenance

### Backup Database

```bash
# Full backup
pg_dump -U postgres mindease_db > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U postgres mindease_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
psql -U postgres mindease_db < backup_20240101.sql

# From compressed file
gunzip -c backup_20240101.sql.gz | psql -U postgres mindease_db
```

### Clean Up Expired Data

```bash
# Run cleanup function
psql -U postgres -d mindease_db -c "SELECT cleanup_expired_analytics();"
```

### View Database Size

```sql
SELECT 
    pg_size_pretty(pg_database_size('mindease_db')) as database_size;
```

### View Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Optimization

### Indexes

All critical indexes are created automatically by `schema.sql`:

- User email lookups
- Mood entry queries by user and date
- Chat message queries by session
- Analytics data by user and period

### Query Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM mood_entries 
WHERE user_id = 'some-uuid' 
ORDER BY timestamp DESC 
LIMIT 20;

-- Update table statistics
ANALYZE mood_entries;
ANALYZE chat_messages;
```

### Connection Pooling

The application uses connection pooling with these defaults:
- Min connections: 2
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

Adjust in `.env.local` based on your needs.

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux
```

### Authentication Failed

```bash
# Reset password
psql postgres
ALTER USER postgres PASSWORD 'new_password';
\q
```

### Permission Denied

```sql
-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE mindease_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Database Doesn't Exist

```bash
# Create database
createdb mindease_db

# Or in psql
psql postgres
CREATE DATABASE mindease_db;
\q
```

## Migration to Production

### 1. Use Managed Database Service

Recommended services:
- **Vercel Postgres** (easiest for Vercel deployments)
- **Supabase** (PostgreSQL with additional features)
- **AWS RDS** (enterprise-grade)
- **Railway** (developer-friendly)
- **Neon** (serverless PostgreSQL)

### 2. Enable SSL

```env
DB_SSL=true
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### 3. Set Up Backups

- Enable automated backups (daily recommended)
- Test restore procedures
- Store backups in separate location

### 4. Monitor Performance

- Set up query performance monitoring
- Track connection pool usage
- Monitor database size growth
- Set up alerts for errors

### 5. Security Checklist

- ✅ Use strong passwords
- ✅ Enable SSL/TLS
- ✅ Restrict network access
- ✅ Regular security updates
- ✅ Audit log monitoring
- ✅ Backup encryption

## Useful Commands

```bash
# Connect to database
psql -U postgres -d mindease_db

# List databases
\l

# List tables
\dt

# Describe table
\d users

# View table data
SELECT * FROM users LIMIT 10;

# Count records
SELECT COUNT(*) FROM mood_entries;

# Exit
\q
```

## Database Schema Diagram

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ email       │
│ name        │
│ password    │
└─────────────┘
      │
      ├──→ user_profiles (1:1)
      ├──→ user_preferences (1:1)
      ├──→ mood_entries (1:N)
      ├──→ chat_sessions (1:N)
      ├──→ chat_messages (1:N)
      ├──→ triggers (1:N)
      ├──→ coping_activities (1:N)
      ├──→ insights (1:N)
      └──→ recommendations (1:N)
```

## Support

For issues or questions:
1. Check PostgreSQL logs: `/usr/local/var/log/postgres.log` (macOS)
2. Review application logs
3. Consult PostgreSQL documentation: https://www.postgresql.org/docs/

## Next Steps

After setting up the database:
1. ✅ Run schema migration
2. ✅ Test connection
3. ✅ Update application services to use database
4. ✅ Test all features
5. ✅ Set up backups
6. ✅ Monitor performance
