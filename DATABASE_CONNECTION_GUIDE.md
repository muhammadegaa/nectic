# Database Connection Guide

This guide explains how to connect external databases to Nectic AI agents.

## Supported Databases

- **PostgreSQL** - Popular open-source relational database
- **MySQL** - Widely-used relational database
- **MongoDB** - Flexible NoSQL document database
- **Firestore** (Default) - Firebase's managed NoSQL database

## Quick Start

### Step 1: Create or Edit an Agent

1. Navigate to `/agents/new` to create a new agent, or `/agents/[id]/edit` to edit an existing one
2. Fill in the agent details (name, description, collections)

### Step 2: Configure Database Connection

1. In the "Database Connection" section, select your database type
2. Choose one of two connection methods:

   **Method A: Connection String (Recommended)**
   ```
   postgresql://username:password@host:5432/database
   mysql://username:password@host:3306/database
   mongodb://username:password@host:27017/database
   ```

   **Method B: Individual Fields**
   - Host: Database server address
   - Port: Database port (defaults shown)
   - Database: Database name
   - Username: Database user
   - Password: Database password
   - SSL/TLS: Enable for secure connections

3. Click **"Test Connection"** to verify your credentials
4. Once successful, click **"Save Connection"**

### Step 3: Configure Collections/Tables

- For **Firestore**: Use collection names (e.g., `finance_transactions`)
- For **SQL databases**: Use table names (e.g., `transactions`, `sales`, `employees`)
- For **MongoDB**: Use collection names (same as Firestore)

## Security

### Credential Encryption

All database credentials are encrypted at rest using **AES-256-GCM** encryption.

**Requirements:**
1. Set `ENCRYPTION_KEY` in your environment variables
2. Generate a secure key: `openssl rand -hex 32`
3. Store the key securely (never commit to git)

**Example:**
```bash
# In .env.local or Vercel environment variables
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Connection Security

- **Use SSL/TLS** when connecting to remote databases
- **Restrict database user permissions** to read-only if possible
- **Use connection pooling** (automatically handled by adapters)
- **Test connections** before saving to verify credentials

## Connection Examples

### PostgreSQL (Local)
```
Type: PostgreSQL
Host: localhost
Port: 5432
Database: myapp_production
Username: postgres
Password: your_password
SSL: Disabled (for local)
```

### PostgreSQL (Production with SSL)
```
Connection String: postgresql://user:pass@db.example.com:5432/mydb?ssl=true
```

### MySQL (Local)
```
Type: MySQL
Host: localhost
Port: 3306
Database: sales_db
Username: admin
Password: secure_password
SSL: Enabled
```

### MongoDB Atlas (Cloud)
```
Connection String: mongodb+srv://user:pass@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Troubleshooting

### Connection Test Fails

1. **Check credentials** - Verify username, password, host, port
2. **Check network access** - Ensure your server can reach the database
3. **Check firewall** - Database port must be accessible
4. **Check SSL settings** - Enable SSL if required by your database
5. **Check database name** - Ensure the database exists

### Common Errors

**Error: "Not connected to database"**
- Connection was lost or never established
- Solution: Test connection again or reconnect

**Error: "Authentication failed"**
- Invalid username or password
- Solution: Verify credentials

**Error: "Connection timeout"**
- Database server is not reachable
- Solution: Check network connectivity and firewall rules

**Error: "Database does not exist"**
- Database name is incorrect
- Solution: Verify database name exists

### Vercel Deployment

When deploying to Vercel:
1. Database must be **publicly accessible** (or use Vercel's private networking)
2. Use **SSL/TLS** for all connections
3. Set **ENCRYPTION_KEY** in Vercel environment variables
4. Test connection from production environment

## Best Practices

1. **Use connection strings** - Simpler and easier to manage
2. **Enable SSL/TLS** - Always use encrypted connections
3. **Limit permissions** - Use database users with minimal required permissions
4. **Test thoroughly** - Always test connections before saving
5. **Monitor connections** - Check database logs for connection issues
6. **Rotate credentials** - Regularly update database passwords

## Schema Discovery

Nectic automatically discovers table/collection schemas:
- For **SQL databases**: Uses `INFORMATION_SCHEMA` queries
- For **MongoDB**: Samples documents to infer schema
- For **Firestore**: Uses document structure

This allows the AI to understand your data structure and generate better queries.

## Next Steps

After connecting your database:
1. Test queries in the chat interface
2. Verify data is accessible
3. Check that filters work correctly
4. Review AI-generated insights

For more help, see the main [README.md](./README.md) or open an issue.

