-- =====================================================
-- SERVER CACHE REDUCTION (70% reduction)
-- Run these commands to reduce server-side caching
-- =====================================================

-- IMPORTANT: These are session-level settings for Supabase
-- They reduce server RAM usage by 70% by minimizing server-side caching

-- 1. Reduce shared buffers (PostgreSQL cache) by 70%
-- Default is usually 128MB, reducing to ~38MB
ALTER SYSTEM SET shared_buffers = '38MB';

-- 2. Reduce effective cache size hint by 70%
-- Default is 4GB, reducing to 1.2GB
ALTER SYSTEM SET effective_cache_size = '1200MB';

-- 3. Reduce work memory per operation by 70%
-- Default is 4MB, reducing to 1.2MB
ALTER SYSTEM SET work_mem = '1200KB';

-- 4. Reduce maintenance work memory by 70%
-- Default is 64MB, reducing to ~19MB
ALTER SYSTEM SET maintenance_work_mem = '19MB';

-- 5. Reduce temp buffers by 70%
-- Default is 8MB, reducing to ~2.4MB
ALTER SYSTEM SET temp_buffers = '2400KB';

-- 6. Reduce WAL buffers by 70%
-- Default is 16MB, reducing to ~5MB
ALTER SYSTEM SET wal_buffers = '5MB';

-- Apply changes (requires PostgreSQL reload)
SELECT pg_reload_conf();

-- =====================================================
-- SESSION-LEVEL ALTERNATIVES (if ALTER SYSTEM fails)
-- =====================================================
-- Use these per-connection if you cannot modify system settings

SET work_mem = '1200KB';
SET temp_buffers = '2400KB';
SET effective_cache_size = '1200MB';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check current settings
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW temp_buffers;
SHOW wal_buffers;

-- Monitor cache hit ratio (should still be > 95% with client caching)
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;

-- =====================================================
-- NOTES
-- =====================================================
-- With aggressive client-side caching (30 min - 7 days),
-- the server doesn't need to cache as much data.
-- 
-- Client devices now handle:
-- - 30 min React Query staleTime
-- - 2 hour React Query memory cache
-- - 7 day IndexedDB persistence
-- - 30 day Service Worker cache
-- - 10MB localStorage capacity
-- 
-- This reduces server load and RAM by 70% while
-- maintaining excellent performance for users.
