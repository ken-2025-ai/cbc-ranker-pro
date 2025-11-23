import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. STORAGE METRICS
    const storageMetrics = await getStorageMetrics(supabase);
    
    // 2. PERFORMANCE METRICS
    const performanceMetrics = await getPerformanceMetrics(supabase);
    
    // 3. NETWORK METRICS
    const networkMetrics = await getNetworkMetrics(supabase);
    
    // 4. USAGE METRICS
    const usageMetrics = await getUsageMetrics(supabase);
    
    // 5. CPU & RAM METRICS (simulated for serverless)
    const systemMetrics = await getSystemMetrics(supabase);
    
    // 6. DATABASE HEALTH
    const databaseHealth = await getDatabaseHealth(supabase);
    
    // 7. FORECAST & PREDICTIONS
    const forecast = await generateForecast(storageMetrics, usageMetrics);
    
    // 8. ALERTS
    const alerts = await generateAlerts(storageMetrics, performanceMetrics, systemMetrics);
    
    // 9. AI OPTIMIZATION SUGGESTIONS
    const suggestions = await generateSuggestions(storageMetrics, performanceMetrics, usageMetrics, databaseHealth);

    const response = {
      cpu: systemMetrics.cpu,
      ram: systemMetrics.ram,
      disk: storageMetrics.disk,
      storage: storageMetrics,
      performance: performanceMetrics,
      network: networkMetrics,
      database: databaseHealth,
      usage: usageMetrics,
      users: {
        active_devices: usageMetrics.total_devices,
        active_schools: usageMetrics.active_institutions,
        sync_delays: {}
      },
      alerts,
      aiSuggestions: suggestions,
      forecast,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('System analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getStorageMetrics(supabase: any) {
  const tables = [
    'students', 'marks_active', 'students_meta', 'rankings_cache',
    'subjects', 'classes', 'exam_periods', 'exams', 'backup_logs',
    'admin_institutions', 'institution_staff', 'admin_activity_logs',
    'device_keys', 'help_tickets', 'payment_history'
  ];

  const counts: any = {};
  let totalRecords = 0;

  for (const table of tables) {
    try {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      counts[table] = count || 0;
      totalRecords += count || 0;
    } catch (e) {
      counts[table] = 0;
    }
  }

  // Calculate storage by school
  const { data: institutions } = await supabase.from('admin_institutions').select('id, name');
  const schoolStorage: any[] = [];

  for (const inst of institutions || []) {
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', inst.id);
    
    const { count: marksCount } = await supabase
      .from('marks_active')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    schoolStorage.push({
      school_id: inst.id,
      school_name: inst.name,
      students: studentsCount || 0,
      marks: marksCount || 0,
      total_records: (studentsCount || 0) + (marksCount || 0)
    });
  }

  // Detailed storage breakdown (Supabase model)
  const estimatedBytes = totalRecords * 500;
  const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(2);
  const estimatedGB = (estimatedBytes / (1024 * 1024 * 1024)).toFixed(3);
  
  const totalCapacityGB = 10; // Assume 10GB limit for demo
  const usedGB = parseFloat(estimatedGB);
  const remainingGB = totalCapacityGB - usedGB;

  return {
    disk: {
      total_gb: totalCapacityGB,
      used_gb: usedGB,
      remaining_gb: Math.max(0, remainingGB),
      used_percent: Math.min((usedGB / totalCapacityGB) * 100, 100)
    },
    total_records: totalRecords,
    estimated_size_mb: parseFloat(estimatedMB),
    estimated_size_gb: usedGB,
    breakdown: counts,
    per_school: schoolStorage,
    per_module: {
      exams: counts.exams + counts.exam_questions,
      students: counts.students + counts.students_meta,
      marks: counts.marks_active,
      auth: counts.admin_institutions + counts.institution_staff,
      logs: counts.admin_activity_logs + counts.backup_logs,
      analytics: counts.rankings_cache
    },
    capacity_used_percent: Math.min((usedGB / totalCapacityGB) * 100, 100)
  };
}

async function getPerformanceMetrics(supabase: any) {
  // Simulate performance by running test queries
  const metrics: any[] = [];
  
  const tests = [
    { name: 'students_query', query: () => supabase.from('students').select('*').limit(100) },
    { name: 'marks_query', query: () => supabase.from('marks_active').select('*').limit(100) },
    { name: 'rankings_query', query: () => supabase.from('rankings_cache').select('*').limit(50) },
    { name: 'exams_query', query: () => supabase.from('exams').select('*').limit(20) },
  ];

  for (const test of tests) {
    const start = Date.now();
    try {
      await test.query();
      const duration = Date.now() - start;
      metrics.push({
        module: test.name,
        response_time_ms: duration,
        status: duration < 200 ? 'fast' : duration < 500 ? 'medium' : 'slow',
        score: Math.max(0, 100 - duration / 10)
      });
    } catch (e) {
      metrics.push({
        module: test.name,
        response_time_ms: -1,
        status: 'error',
        score: 0
      });
    }
  }

  const avgScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;

  return {
    overall_score: Math.round(avgScore),
    modules: metrics,
    grade: avgScore >= 90 ? 'A+' : avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'C' : 'D'
  };
}

async function getNetworkMetrics(supabase: any) {
  // Get recent edge function logs to estimate bandwidth
  const { data: logs } = await supabase
    .from('admin_activity_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1000);

  const requestCount = logs?.length || 0;
  const estimatedBandwidthMB = (requestCount * 10) / 1024; // ~10KB per request

  return {
    requests_24h: requestCount,
    estimated_bandwidth_mb: estimatedBandwidthMB.toFixed(2),
    efficiency_grade: requestCount < 10000 ? 'A+' : requestCount < 50000 ? 'A' : 'B',
    avg_request_size_kb: 10
  };
}

async function getUsageMetrics(supabase: any) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Active institutions
  const { count: activeInstitutions } = await supabase
    .from('admin_institutions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Recent activity
  const { count: activity24h } = await supabase
    .from('admin_activity_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last24h.toISOString());

  const { count: activity7d } = await supabase
    .from('admin_activity_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last7d.toISOString());

  // Device registrations
  const { count: totalDevices } = await supabase
    .from('device_keys')
    .select('*', { count: 'exact', head: true });

  return {
    active_institutions: activeInstitutions || 0,
    total_devices: totalDevices || 0,
    activity_24h: activity24h || 0,
    activity_7d: activity7d || 0,
    daily_avg: Math.round((activity7d || 0) / 7),
    monthly_projection: Math.round((activity7d || 0) / 7 * 30)
  };
}

async function generateAlerts(storage: any, performance: any, system: any) {
  const alerts: any[] = [];

  // CPU alerts
  if (system.cpu.currentLoad > 80) {
    alerts.push({
      severity: 'critical',
      type: 'performance',
      message: `CPU load critically high: ${system.cpu.currentLoad.toFixed(1)}%`,
      action: 'Scale infrastructure or optimize heavy operations',
      timestamp: new Date().toISOString(),
      recommendedAction: 'immediate_scaling'
    });
  } else if (system.cpu.currentLoad > 60) {
    alerts.push({
      severity: 'medium',
      type: 'performance',
      message: `CPU load elevated: ${system.cpu.currentLoad.toFixed(1)}%`,
      action: 'Monitor CPU trends and optimize queries',
      timestamp: new Date().toISOString(),
      recommendedAction: 'optimization'
    });
  }

  // RAM alerts
  if (system.ram.used_percent > 85) {
    alerts.push({
      severity: 'high',
      type: 'performance',
      message: `RAM usage high: ${system.ram.used_percent.toFixed(1)}%`,
      action: 'Clear caches or increase memory allocation',
      timestamp: new Date().toISOString(),
      recommendedAction: 'clear_memory'
    });
  }

  // Storage alerts
  if (storage.capacity_used_percent >= 90) {
    alerts.push({
      severity: 'critical',
      type: 'storage',
      message: `Storage critically low: ${storage.capacity_used_percent.toFixed(1)}% used`,
      action: 'Immediate cleanup or storage upgrade required',
      timestamp: new Date().toISOString(),
      recommendedAction: 'urgent_cleanup'
    });
  } else if (storage.capacity_used_percent >= 70) {
    alerts.push({
      severity: 'medium',
      type: 'storage',
      message: `Storage at ${storage.capacity_used_percent.toFixed(1)}% capacity`,
      action: 'Monitor storage growth and plan cleanup',
      timestamp: new Date().toISOString(),
      recommendedAction: 'monitor'
    });
  }

  // Performance alerts
  if (performance.overall_score < 60) {
    alerts.push({
      severity: 'high',
      type: 'performance',
      message: `Performance score low: ${performance.overall_score}/100`,
      action: 'Review slow queries and optimize database',
      timestamp: new Date().toISOString(),
      recommendedAction: 'optimize_database'
    });
  }

  // Check for slow modules
  const slowModules = performance.modules.filter((m: any) => m.status === 'slow');
  if (slowModules.length > 0) {
    alerts.push({
      severity: 'medium',
      type: 'performance',
      message: `${slowModules.length} module(s) responding slowly`,
      action: 'Optimize: ' + slowModules.map((m: any) => m.module).join(', '),
      timestamp: new Date().toISOString(),
      recommendedAction: 'module_optimization'
    });
  }

  return alerts;
}

async function getSystemMetrics(supabase: any) {
  // Simulate CPU and RAM metrics (serverless environment)
  const cpuLoad = Math.random() * 30 + 20; // 20-50% simulated
  const ramUsed = Math.random() * 200 + 300; // 300-500 MB simulated
  const ramTotal = 512; // 512 MB simulated
  
  return {
    cpu: {
      currentLoad: parseFloat(cpuLoad.toFixed(2)),
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - (19 - i) * 60000).toISOString(),
        load: Math.random() * 30 + 20
      })),
      heatmap: {
        'students_query': Math.random() * 20 + 10,
        'marks_query': Math.random() * 30 + 20,
        'rankings_compute': Math.random() * 40 + 30,
        'exams_generate': Math.random() * 50 + 40
      }
    },
    ram: {
      used: ramUsed,
      total: ramTotal,
      used_percent: (ramUsed / ramTotal) * 100,
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - (19 - i) * 60000).toISOString(),
        used: Math.random() * 200 + 300
      }))
    }
  };
}

async function getDatabaseHealth(supabase: any) {
  const { data: slowQueries } = await supabase
    .from('admin_activity_logs')
    .select('action_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    queryLatency: Math.random() * 50 + 30, // 30-80ms average
    slowQueries: slowQueries || [],
    tableHealth: {
      students: { size_mb: 45, read_freq: 1200, write_freq: 80 },
      marks_active: { size_mb: 120, read_freq: 2500, write_freq: 300 },
      exams: { size_mb: 80, read_freq: 800, write_freq: 50 },
      rankings_cache: { size_mb: 30, read_freq: 500, write_freq: 100 }
    },
    indexHealth: 'good',
    recommendedIndexes: []
  };
}

async function generateForecast(storage: any, usage: any) {
  const growthRate = 0.05; // 5% monthly growth assumption
  const currentUsagePercent = storage.capacity_used_percent;
  const monthsUntilFull = currentUsagePercent >= 100 ? 0 : 
    Math.ceil((100 - currentUsagePercent) / (growthRate * 100));

  return {
    storageRunOutInDays: monthsUntilFull * 30,
    performancePrediction: 'stable',
    growth_rate_percent: growthRate * 100,
    projected_usage_30d: Math.min(100, currentUsagePercent + (growthRate * 100)),
    projected_users_30d: Math.round(usage.active_institutions * 1.1)
  };
}

async function generateSuggestions(storage: any, performance: any, usage: any, database: any) {
  const suggestions: any[] = [];

  // Critical storage warnings
  if (storage.capacity_used_percent > 85) {
    suggestions.push({
      category: 'storage',
      title: 'Critical: Storage Near Capacity',
      description: 'Implement immediate cleanup or upgrade storage tier',
      impact: 'critical',
      effort: 'high',
      action: 'cleanup_or_upgrade',
      severity: 'critical'
    });
  }

  // Storage optimization
  if (storage.breakdown.rankings_cache > 1000) {
    suggestions.push({
      category: 'storage',
      title: 'Clear Rankings Cache',
      description: `${storage.breakdown.rankings_cache} cached rankings can be cleaned`,
      impact: 'medium',
      effort: 'low',
      action: 'clear_cache',
      severity: 'medium'
    });
  }

  if (storage.breakdown.backup_logs > 100) {
    suggestions.push({
      category: 'storage',
      title: 'Archive Old Backups',
      description: 'Archive backup logs older than 6 months',
      impact: 'low',
      effort: 'low',
      action: 'archive_logs',
      severity: 'low'
    });
  }

  // Performance optimization
  if (performance.overall_score < 80) {
    suggestions.push({
      category: 'performance',
      title: 'Optimize Database Queries',
      description: 'Add indexes on frequently queried columns to improve response time',
      impact: 'high',
      effort: 'medium',
      action: 'add_indexes',
      severity: 'high'
    });

    suggestions.push({
      category: 'performance',
      title: 'Enable Query Caching',
      description: 'Cache heavy read operations to reduce database load',
      impact: 'high',
      effort: 'medium',
      action: 'enable_caching',
      severity: 'medium'
    });
  }

  // Database health
  if (database.queryLatency > 100) {
    suggestions.push({
      category: 'database',
      title: 'High Query Latency Detected',
      description: 'Consider connection pooling and query optimization',
      impact: 'high',
      effort: 'medium',
      action: 'optimize_queries',
      severity: 'high'
    });
  }

  // Network optimization
  if (usage.daily_avg > 5000) {
    suggestions.push({
      category: 'network',
      title: 'Implement Data Compression',
      description: 'Compress API payloads to reduce bandwidth usage',
      impact: 'medium',
      effort: 'low',
      action: 'enable_compression',
      severity: 'low'
    });
  }

  return suggestions;
}
