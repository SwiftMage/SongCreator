# Database Management Scripts

## ⚠️ DANGER: Data Destruction Scripts

These scripts will **permanently delete ALL user data** from your database. Use only for development/testing purposes.

## Available Scripts

### 1. SQL Script (`wipe-user-data.sql`)

Direct SQL commands to wipe all user data. Execute in Supabase SQL editor or via CLI.

**Usage:**
```bash
# Copy and paste the SQL into Supabase SQL editor
# OR use Supabase CLI:
supabase db reset
```

### 2. Node.js Script (`wipe-user-data.js`)

Interactive Node.js script with safety confirmation and progress feedback.

**Usage:**
```bash
# Run directly:
node scripts/wipe-user-data.js

# OR use npm script:
npm run wipe-db
```

**Requirements:**
- `NEXT_PUBLIC_SUPABASE_URL` in your .env file
- `SUPABASE_SERVICE_ROLE_KEY` in your .env file

## What Gets Deleted

These scripts will delete **ALL** data from the following tables:

1. **`billing_history`** - All subscription billing records
2. **`orders`** - All purchase orders  
3. **`songs`** - All user-created songs and lyrics
4. **`audit_log`** - All audit trail records (for user tables)
5. **`profiles`** - All user profile data
6. **`auth.users`** - All user accounts and authentication data
7. **Auth sessions** - All active user sessions

## Safety Features

### Node.js Script Safety:
- ✅ **Confirmation prompt**: Must type "DELETE ALL" to proceed
- ✅ **Environment validation**: Checks for required environment variables
- ✅ **Progress feedback**: Shows what's being deleted
- ✅ **Error handling**: Continues on errors, shows what failed
- ✅ **Verification**: Shows final record counts after deletion

### SQL Script Safety:
- ✅ **Transaction wrapper**: Uses BEGIN/COMMIT for atomicity
- ✅ **Dependency order**: Deletes in correct order to avoid constraint violations
- ✅ **Verification queries**: Includes queries to check final state

## After Running the Script

1. **All user accounts will be deleted** - users will need to register again
2. **All user data will be lost** - songs, orders, billing history, etc.
3. **Database structure remains intact** - tables, columns, indexes preserved
4. **You can immediately start fresh** - new users can register normally

## Example Output

```
🚨 DATABASE WIPE UTILITY 🚨
This will permanently delete ALL user data from your database.
Tables affected: auth.users, profiles, songs, orders, billing_history, audit_log

⚠️  This will DELETE ALL USER DATA from your database. Are you sure? (type "DELETE ALL" to confirm): DELETE ALL

🗑️  Starting database wipe...

Deleting billing_history...
✅ billing_history deleted
Deleting orders...
✅ orders deleted
Deleting songs...
✅ songs deleted
Deleting audit_log...
✅ audit_log deleted
Deleting profiles...
✅ profiles deleted
Deleting auth users...
✅ Deleted 5 auth users

🎉 Database wipe complete!

🔍 Verifying wipe...
📊 profiles: 0 records remaining
📊 songs: 0 records remaining
📊 orders: 0 records remaining
📊 billing_history: 0 records remaining
📊 auth.users: 0 users remaining
```

## When to Use

- **Development**: Clean slate for testing new features
- **Staging**: Reset test environment between test cycles  
- **Architecture changes**: Start fresh after major database schema changes
- **Demo purposes**: Clean demo environment

## When NOT to Use

- ❌ **Production environments** - This will destroy real user data
- ❌ **Shared development databases** - Will affect other developers
- ❌ **Without team coordination** - Make sure everyone knows the wipe is happening