# Supabase Best Practices Guide

## Overview

Supabase is a PostgreSQL-based backend that requires careful attention to security, performance, and data consistency. This guide covers essential practices for production-ready implementations.

---

## 1. Row-Level Security (RLS)

### What is RLS?
Row-Level Security enables database-level access control. Only rows matching the policy are visible to the user.

### Basic RLS Policy
```sql
-- Enable RLS on table
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only servicos from their obra
CREATE POLICY "Users see own obra services"
  ON servicos
  FOR SELECT
  USING (
    obra_id IN (
      SELECT id FROM obras 
      WHERE owner_id = auth.uid()
    )
  );
```

### Policy Types
| Type   | Purpose                      | Example                              |
|--------|------------------------------|--------------------------------------|
| SELECT | Read access                  | `USING (obra_id = auth.uid())`       |
| INSERT | Create access                | `WITH CHECK (owner_id = auth.uid())` |
| UPDATE | Modify existing records      | `USING` + `WITH CHECK`               |
| DELETE | Remove records               | `USING (owner_id = auth.uid())`      |

---

## 2. Constraints & Data Integrity

### Primary Keys
```sql
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Foreign Keys (Referential Integrity)
```sql
CREATE TABLE servicos (
  id UUID PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL
);
```

### Unique Constraints
```sql
-- Prevent duplicate email addresses
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  obra_id UUID NOT NULL
);
```

### Check Constraints
```sql
-- Ensure valid status values
ALTER TABLE servicos
ADD CONSTRAINT valid_status 
CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido'));
```

---

## 3. Indexing Strategy

### Common Index Types

| Index Type | Use Case                    | Example                        |
|------------|----------------------------|--------------------------------|
| B-Tree     | General queries, sorting    | `CREATE INDEX idx_obra_nome`   |
| Hash       | Exact match (=)             | `CREATE INDEX idx_obra_id USING HASH` |
| BRIN       | Large tables, time ranges   | `CREATE INDEX idx_created_at USING BRIN` |

### Index Creation
```sql
-- Single column
CREATE INDEX idx_servicos_obra_id ON servicos(obra_id);

-- Multiple columns (composite)
CREATE INDEX idx_diario_obra_date ON diario_obra(obra_id, data_dia);

-- Partial index (for specific rows)
CREATE INDEX idx_active_servicos 
  ON servicos(obra_id) 
  WHERE status != 'concluido';
```

### Index Maintenance
```sql
-- Check index size
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelname::regclass))
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelname::regclass) DESC;

-- Remove unused indexes
DROP INDEX idx_old_index;
```

---

## 4. Performance Optimization

### Query Optimization
```sql
-- ❌ Slow: Full table scan
SELECT * FROM servicos WHERE EXTRACT(YEAR FROM created_at) = 2026;

-- ✅ Fast: Use indexed range
SELECT * FROM servicos WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';
```

### Connection Pooling
```javascript
// Use connection pooling for production
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    db: { schema: 'public' },
    pooling: { max: 10 }  // Connection pool size
  }
);
```

### Batch Operations
```sql
-- ❌ Slow: Individual inserts
INSERT INTO servicos (id, nome, obra_id) VALUES (...);
INSERT INTO servicos (id, nome, obra_id) VALUES (...);

-- ✅ Fast: Batch insert
INSERT INTO servicos (id, nome, obra_id) VALUES
  (...),
  (...),
  (...);
```

---

## 5. Triggers & Automation

### Auto-Update Timestamps
```sql
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON servicos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Audit Logging
```sql
-- Create audit table
CREATE TABLE servicos_audit (
  id UUID,
  action VARCHAR(50),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT now()
);

-- Log changes
CREATE TRIGGER log_servicos_changes
AFTER UPDATE ON servicos
FOR EACH ROW
EXECUTE FUNCTION log_servicos_change();
```

---

## 6. Authentication & Authorization

### Setup Basic Auth
```javascript
// Enable email/password auth in Supabase dashboard
// Then use:

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password-123'
});
```

### Protect API Routes
```javascript
// Middleware: Check JWT token
const protectedRoute = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // User is authenticated
  res.json({ data: 'Protected content' });
};
```

---

## 7. Data Backup & Recovery

### Automated Backups
- Supabase provides daily backups automatically
- Access via Project Settings → Backups
- Retention: 7 days (Enterprise: 30+ days)

### Manual Export
```bash
# Use pg_dump to export database
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
```

---

## 8. Realtime Subscriptions

### Listen for Changes
```javascript
// Subscribe to table changes
const subscription = supabase
  .channel('servicos-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'servicos' },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

---

## 9. Common Pitfalls

| Issue                      | Problem                           | Solution                      |
|---------------------------|-----------------------------------|-------------------------------|
| No RLS enabled             | All users see all data            | Enable RLS + create policies  |
| Missing indexes            | Slow queries on large tables      | Add indexes for filtered columns |
| N+1 queries                | Multiple round trips to DB        | Use joins or batch queries    |
| Unbounded queries          | Out-of-memory errors              | Add LIMIT, use pagination     |
| Improper cascade deletes   | Orphaned records                  | Use ON DELETE CASCADE properly |

---

## 10. Monitoring & Debugging

### Check Active Connections
```sql
SELECT datname, usename, application_name, client_addr, state 
FROM pg_stat_activity;
```

### View Query Performance
```sql
-- Enable query logging
ALTER DATABASE postgres SET log_statement = 'all';

-- View slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Check Table Sizes
```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Best Practices Checklist

- ✅ Enable RLS on all tables
- ✅ Add foreign key constraints
- ✅ Create indexes on filtered/joined columns
- ✅ Use composite indexes for common queries
- ✅ Set up proper triggers for audit trails
- ✅ Implement connection pooling
- ✅ Use batch operations for bulk inserts
- ✅ Monitor query performance
- ✅ Set up automated backups
- ✅ Test RLS policies with multiple users

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Index Guide](https://www.postgresql.org/docs/current/indexes.html)
- [Query Performance Tips](https://supabase.com/docs/guides/database/query-performance)
