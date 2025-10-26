# Quick Start: Database Setup

Get PostgreSQL + pgvector and Redis running in 5 minutes!

## Option 1: Docker (Recommended)

### 1. Start Database Services
```bash
cd backend
npm run db:setup
```

This starts:
- PostgreSQL with pgvector on port 5432
- Redis on port 6379

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Migrations
```bash
npm run migration:run
```

### 4. Start the Application
```bash
npm run start:dev
```

### Optional: Start Database Tools
```bash
npm run db:tools
```

Access:
- **pgAdmin**: http://localhost:5050 (admin@agentic-wallet.com / admin)
- **Redis Commander**: http://localhost:8081

## Option 2: Local Installation

### macOS
```bash
# Install PostgreSQL and pgvector
brew install postgresql@15 pgvector
brew services start postgresql@15

# Install Redis
brew install redis
brew services start redis

# Create database
psql -U postgres -c "CREATE DATABASE agentic_wallet;"
psql -U postgres -d agentic_wallet -c "CREATE EXTENSION vector;"

# Install dependencies and run migrations
npm install
npm run migration:run

# Start application
npm run start:dev
```

### Ubuntu/Linux
```bash
# Install PostgreSQL and pgvector
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-15-pgvector redis-server

# Start services
sudo systemctl start postgresql redis

# Create database
sudo -u postgres psql -c "CREATE DATABASE agentic_wallet;"
sudo -u postgres psql -d agentic_wallet -c "CREATE EXTENSION vector;"

# Install dependencies and run migrations
npm install
npm run migration:run

# Start application
npm run start:dev
```

## Verify Setup

### Check PostgreSQL
```bash
psql -U postgres -d agentic_wallet -c "\dt"
```

Expected output:
```
              List of relations
 Schema |       Name        | Type  |  Owner   
--------+-------------------+-------+----------
 public | agent_sessions    | table | postgres
 public | research_queries  | table | postgres
 public | transactions      | table | postgres
 public | users             | table | postgres
 public | wallets           | table | postgres
```

### Check Redis
```bash
redis-cli ping
```

Expected output: `PONG`

### Check pgvector
```bash
psql -U postgres -d agentic_wallet -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

## Environment Variables

Update `.env` file:
```env
# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=agentic_wallet

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Common Commands

```bash
# Start databases (Docker)
npm run db:setup

# Stop databases (Docker)
npm run db:down

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Start with database tools
npm run db:tools
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5432
lsof -i :5432

# Check what's using port 6379
lsof -i :6379

# Kill process if needed
kill -9 <PID>
```

### Connection Refused
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check if Redis is running
redis-cli ping

# Restart Docker containers
docker-compose restart
```

### Migration Errors
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS agentic_wallet;"
psql -U postgres -c "CREATE DATABASE agentic_wallet;"
psql -U postgres -d agentic_wallet -c "CREATE EXTENSION vector;"

# Run migrations again
npm run migration:run
```

## Next Steps

1. ✅ Database is running
2. ✅ Migrations applied
3. ✅ Application started

Now you can:
- Use repositories in your services
- Store user data and wallets
- Cache with Redis
- Perform semantic search with pgvector

See `DATABASE_SETUP.md` for detailed documentation.
