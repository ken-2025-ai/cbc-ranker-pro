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
    
    // 5. ALERTS
    const alerts = await generateAlerts(storageMetrics, performanceMetrics);
    
    // 6. OPTIMIZATION SUGGESTIONS
    const suggestions = await generateSuggestions(storageMetrics, performanceMetrics, usageMetrics);

    const response = {
      storage: storageMetrics,
      performance: performanceMetrics,
      network: networkMetrics,
      usage: usageMetrics,
      alerts,
      suggestions,
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
    'admin_institutions', 'institution_staff'
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
      .select('ma.*, sm.institution_id', { count: 'exact', head: true })
      .eq('sm.institution_id', inst.id)
      .inner('students_meta!marks_active_student_id_fkey', 'sm');

    schoolStorage.push({
      school_id: inst.id,
      school_name: inst.name,
      students: studentsCount || 0,
      marks: marksCount || 0,
      total_records: (studentsCount || 0) + (marksCount || 0)
    });
  }

  // Estimate storage size (rough calculation)
  const estimatedBytes = totalRecords * 500; // ~500 bytes per record average
  const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(2);
  const estimatedGB = (estimatedBytes / (1024 * 1024 * 1024)).toFixed(3);

  return {
    total_records: totalRecords,
    estimated_size_mb: parseFloat(estimatedMB),
    estimated_size_gb: parseFloat(estimatedGB),
    breakdown: counts,
    per_school: schoolStorage,
    capacity_used_percent: Math.min((totalRecords / 1000000) * 100, 100), // Assume 1M records = 100%
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

async function generateAlerts(storage: any, performance: any) {
  const alerts: any[] = [];

  // Storage alerts
  if (storage.capacity_used_percent >= 90) {
    alerts.push({
      severity: 'high',
      type: 'storage',
      message: `Storage at ${storage.capacity_used_percent.toFixed(1)}% capacity`,
      action: 'Consider running cleanup or upgrading storage'
    });
  } else if (storage.capacity_used_percent >= 70) {
    alerts.push({
      severity: 'medium',
      type: 'storage',
      message: `Storage at ${storage.capacity_used_percent.toFixed(1)}% capacity`,
      action: 'Monitor storage growth trends'
    });
  }

  // Performance alerts
  if (performance.overall_score < 60) {
    alerts.push({
      severity: 'high',
      type: 'performance',
      message: `Performance score is low: ${performance.overall_score}/100`,
      action: 'Review slow queries and optimize database'
    });
  }

  // Check for slow modules
  const slowModules = performance.modules.filter((m: any) => m.status === 'slow');
  if (slowModules.length > 0) {
    alerts.push({
      severity: 'medium',
      type: 'performance',
      message: `${slowModules.length} module(s) responding slowly`,
      action: 'Optimize queries: ' + slowModules.map((m: any) => m.module).join(', ')
    });
  }

  return alerts;
}

async function generateSuggestions(storage: any, performance: any, usage: any) {
  const suggestions: any[] = [];

  // Storage optimization
  if (storage.breakdown.rankings_cache > 1000) {
    suggestions.push({
      category: 'storage',
      title: 'Clear Rankings Cache',
      description: `${storage.breakdown.rankings_cache} cached rankings can be cleaned`,
      impact: 'medium',
      effort: 'low'
    });
  }

  if (storage.breakdown.backup_logs > 100) {
    suggestions.push({
      category: 'storage',
      title: 'Archive Old Backups',
      description: 'Archive backup logs older than 6 months',
      impact: 'low',
      effort: 'low'
    });
  }

  // Performance optimization
  if (performance.overall_score < 80) {
    suggestions.push({
      category: 'performance',
      title: 'Add Database Indexes',
      description: 'Create indexes on frequently queried columns',
      impact: 'high',
      effort: 'medium'
    });

    suggestions.push({
      category: 'performance',
      title: 'Enable Query Caching',
      description: 'Cache heavy read operations to reduce load',
      impact: 'high',
      effort: 'medium'
    });
  }

  // Usage optimization
  if (usage.daily_avg < 100) {
    suggestions.push({
      category: 'usage',
      title: 'Low Activity Detected',
      description: 'Consider user engagement initiatives',
      impact: 'low',
      effort: 'high'
    });
  }

  return suggestions;
}
