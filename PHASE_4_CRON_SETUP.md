# Phase 4: Automated Scheduling Setup

Phase 4 implementation is complete! To finish the setup, you need to configure the automated daily cleanup job.

## Setup Instructions

### 1. Enable Required Extensions

First, enable the required PostgreSQL extensions by running this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Schedule the Daily Cleanup Job

Run this SQL to create a cron job that runs daily at 2 AM UTC:

```sql
SELECT cron.schedule(
  'daily-cleanup-job',
  '0 2 * * *', -- Run at 2 AM UTC every day
  $$
  SELECT net.http_post(
    url := 'https://tzdpqwkbkuqypzzuphmt.supabase.co/functions/v1/scheduled-cleanup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZHBxd2tia3VxeXB6enVwaG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTExNTAsImV4cCI6MjA2ODI2NzE1MH0.paCwBEmKBkPAzj5z-_kEWfuBWKLFYcTEBgstH1Xans8"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);
```

### 3. Verify the Cron Job

Check that the job was created successfully:

```sql
SELECT * FROM cron.job;
```

### 4. Monitor Execution

View cron job execution history:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-cleanup-job')
ORDER BY start_time DESC 
LIMIT 10;
```

## What Happens During Cleanup

The daily cleanup job:

1. **Deletes expired records** from `marks_active` table (records past their TTL)
2. **Cleans up old rankings** from `rankings_cache` table
3. **Archives old backup logs** from `backup_logs` table
4. **Triggers backup notifications** for exam periods that haven't been backed up yet
5. **Sends email notifications** to administrators about archived data

## Manual Cleanup

You can also run cleanup manually through the admin dashboard:

1. Go to **Admin Dashboard**
2. Click **System Monitoring** in the sidebar
3. Click **Run Cleanup** button

## Monitoring

The **System Monitoring** dashboard shows:

- Current storage statistics (active marks, metadata, cache entries)
- Number of expired records awaiting cleanup
- Recent cleanup results
- Backup operation logs with status

## Troubleshooting

### Cron Job Not Running

1. Check if extensions are enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
   ```

2. Check cron job status:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'daily-cleanup-job';
   ```

3. View error logs:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE status = 'failed' 
   ORDER BY start_time DESC;
   ```

### Delete and Recreate Job

If you need to modify the schedule:

```sql
-- Delete the old job
SELECT cron.unschedule('daily-cleanup-job');

-- Create a new one with updated schedule
-- (Then run the schedule command from step 2)
```

## Cron Schedule Format

The schedule uses standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month

---

**Phase 4 Complete!** 🎉

Your CBC Pro Ranker system now has:
✅ WhatsApp-style temporary storage with automatic TTL
✅ Automated daily cleanup of expired data
✅ Backup notification system with email alerts
✅ Real-time monitoring dashboard
✅ Manual intervention tools for administrators
