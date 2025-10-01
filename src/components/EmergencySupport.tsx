import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, CheckCircle, Zap } from 'lucide-react';

interface EmergencySupportProps {
  institutionId?: string;
  institutionName?: string;
}

const EmergencySupport = ({ institutionId, institutionName }: EmergencySupportProps) => {
  const { toast } = useToast();
  const [issue, setIssue] = useState('');
  const [issueType, setIssueType] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);

  const issueTypes = [
    { value: 'login_access', label: 'Login/Access Issues' },
    { value: 'data_sync', label: 'Data Synchronization' },
    { value: 'performance', label: 'Performance Problems' },
    { value: 'features', label: 'Feature Not Working' },
    { value: 'reports', label: 'Reports/Analytics Issues' },
    { value: 'payment', label: 'Payment/Subscription' },
    { value: 'other', label: 'Other Technical Issue' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issue.trim() || !issueType) {
      toast({
        title: "Missing Information",
        description: "Please describe your issue and select a category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSolution(null);

    try {
      const { data, error } = await supabase.functions.invoke('emergency-support', {
        body: {
          issue: issue.trim(),
          issueType,
          institutionId: institutionId || 'unknown',
          institutionName: institutionName || 'Unknown Institution',
        },
      });

      if (error) throw error;

      if (data?.solution) {
        setSolution(data.solution);
        toast({
          title: "Solution Generated",
          description: "Our AI has analyzed your issue and provided a solution",
        });
      }
    } catch (error) {
      console.error('Emergency support error:', error);
      toast({
        title: "Error",
        description: "Failed to get emergency support. Please contact admin directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIssue('');
    setIssueType('');
    setSolution(null);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <div>
            <CardTitle className="text-white">Emergency AI Support</CardTitle>
            <CardDescription className="text-slate-400">
              Get instant AI-powered solutions for technical issues
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!solution ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueType" className="text-slate-300">Issue Category</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select issue type..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {issueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue" className="text-slate-300">Describe Your Issue</Label>
              <Textarea
                id="issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Please describe the problem you're experiencing in detail..."
                className="bg-slate-700 border-slate-600 text-white min-h-[150px]"
                disabled={loading}
              />
            </div>

            <Alert className="bg-blue-950/30 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                Our AI will analyze your issue and provide immediate step-by-step solutions.
                For critical issues, admin will be automatically notified.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              disabled={loading || !issue.trim() || !issueType}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Issue...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Get AI Solution
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-950/30 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Solution generated successfully!
              </AlertDescription>
            </Alert>

            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                AI Solution:
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-slate-300 whitespace-pre-wrap">{solution}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Submit Another Issue
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(solution);
                  toast({
                    title: "Copied!",
                    description: "Solution copied to clipboard",
                  });
                }}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-600/20"
              >
                Copy Solution
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencySupport;
