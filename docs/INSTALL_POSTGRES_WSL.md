# Install PostgreSQL in WSL

Run these commands manually in your WSL terminal:

## 1. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL and additional modules
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Enable PostgreSQL to start automatically
sudo systemctl enable postgresql
```

## 2. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In the PostgreSQL prompt, run these commands:
CREATE USER cogito WITH PASSWORD 'cogito_dev_password';
CREATE DATABASE cogito_multi OWNER cogito;
GRANT ALL PRIVILEGES ON DATABASE cogito_multi TO cogito;

# Grant additional privileges
ALTER USER cogito CREATEDB;

# Exit PostgreSQL prompt
\q
```

## 3. Test Connection

```bash
# Test connection as cogito user
psql -U cogito -d cogito_multi -h localhost

# You should see PostgreSQL prompt
# Exit with \q
```

## 4. Configure PostgreSQL for Local Development

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf

# Find and uncomment/modify this line:
listen_addresses = 'localhost'

# Edit authentication file
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add this line at the top of the file (before other rules):
local   all             cogito                                  md5
host    all             cogito          127.0.0.1/32            md5
```

## 5. Restart PostgreSQL

```bash
sudo service postgresql restart
```

## 6. Run Our Setup Script

After PostgreSQL is installed and configured, run:

```bash
cd /home/ken/claude-projects/cogito-multi
npm run setup-postgres
```

## Troubleshooting

If you get connection errors, check:

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Restart if needed
sudo service postgresql restart
```