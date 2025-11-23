import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Database, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const DataCleanup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<any>(null);

  const handleManualCleanup = async () => {
    setLoading(true);
    try {
      // Call the database cleanup function directly
      const { data, error } = await supabase.rpc('run_tracked_cleanup' as any) as { 
        data: any; 
        error: any 
      };

      if (error) throw error;

      setLastCleanup(data);

      const totalDeleted = (data as any)?.total_rows_deleted || 0;
      const duration = (data as any)?.duration_ms || 0;

      toast({
        title: "Cleanup Completed",
        description: `Deleted ${totalDeleted} expired records in ${duration}ms`,
      });
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to run cleanup. Please run the SQL fix from DATABASE_FIXES.sql",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            WhatsApp-Style Data Management
          </CardTitle>
          <CardDescription>
            Automated cleanup system removes expired data to maintain optimal performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Storage</p>
                    <p className="text-2xl font-bold text-primary">marks_active</p>
                  </div>
                  <Database className="h-8 w-8 text-primary" />
                </div>
                <Badge variant="secondary" className="mt-2">12-month TTL</Badge>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Permanent Backup</p>
                    <p className="text-2xl font-bold text-success">marks</p>
                  </div>
                  <Calendar className="h-8 w-8 text-success" />
                </div>
                <Badge variant="secondary" className="mt-2">Never expires</Badge>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rankings Cache</p>
                    <p className="text-2xl font-bold text-warning">Temporary</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-warning" />
                </div>
                <Badge variant="secondary" className="mt-2">3-month TTL</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Cleanup Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Run Manual Cleanup</h4>
                <p className="text-sm text-muted-foreground">
                  Remove expired data and trigger backups for archived exam periods
                </p>
              </div>
              <Button
                onClick={handleManualCleanup}
                disabled={loading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? 'Cleaning...' : 'Run Cleanup'}
              </Button>
            </div>

            {lastCleanup && (
              <Card className="bg-accent/10">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Last Cleanup Results</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Timestamp: {new Date((lastCleanup as any).timestamp).toLocaleString()}</p>
                    <p>• Total Rows Deleted: {(lastCleanup as any).total_rows_deleted || 0}</p>
                    <p>• Execution Time: {(lastCleanup as any).duration_ms || 0}ms</p>
                    {(lastCleanup as any).tables_cleaned && (
                      <div className="mt-2">
                        <p className="font-medium">Tables Cleaned:</p>
                        <ul className="list-disc list-inside ml-2">
                          {(lastCleanup as any).tables_cleaned.map((table: any, idx: number) => (
                            <li key={idx}>
                              {table.table}: {table.rows_deleted} rows
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Information */}
          <Card className="bg-primary/5">
            <CardContent className="p-4 space-y-2 text-sm">
              <h4 className="font-semibold">How It Works</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Active marks stored in marks_active with 12-month expiry</li>
                <li>Expired marks automatically archived to permanent marks table</li>
                <li>Rankings cached for 3 months for fast retrieval</li>
                <li>Cleanup runs automatically or can be triggered manually</li>
                <li>Email notifications sent when data is backed up</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataCleanup;
