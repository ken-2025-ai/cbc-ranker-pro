import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, BookOpen, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `TKT-${year}${month}${day}-${random}`;
};

const ticketSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email is too long'),
  phone_number: z.string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format'),
  issue_type: z.string()
    .min(1, 'Please select an issue type'),
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description is too long')
});

const HelpButton = React.memo(() => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    issue_type: '',
    description: ''
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Trim all string fields
      const trimmedData = {
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        issue_type: formData.issue_type,
        description: formData.description.trim()
      };

      // Validate form data
      const validated = ticketSchema.parse(trimmedData);
      setLoading(true);

      // Generate unique ticket number
      const generatedTicketNumber = generateTicketNumber();

      // Insert ticket into database
      const { data, error } = await supabase
        .from('help_tickets')
        .insert([{
          ticket_number: generatedTicketNumber,
          email: validated.email,
          phone_number: validated.phone_number,
          issue_type: validated.issue_type,
          description: validated.description,
          status: 'open',
          priority: 'normal'
        }])
        .select('ticket_number')
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to create ticket. Please try again.');
      }

      // Success
      setTicketNumber(data.ticket_number);
      setSubmitted(true);
      setFormData({ email: '', phone_number: '', issue_type: '', description: '' });

      toast({
        title: "Ticket Submitted Successfully",
        description: `Your ticket ${data.ticket_number} has been created. We'll respond within 72 hours.`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Validation error
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        // Other errors
        console.error('Error submitting ticket:', error);
        toast({
          title: "Submission Failed",
          description: error.message || "Failed to submit ticket. Please try again.",
          variant: "destructive",
        });
      } else {
        // Unknown error
        console.error('Unknown error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, toast]);

  const resetForm = useCallback(() => {
    setSubmitted(false);
    setTicketNumber('');
    setFormData({ email: '', phone_number: '', issue_type: '', description: '' });
  }, []);

  const issueTypes = [
    { value: 'login', label: 'Login Issues' },
    { value: 'access', label: 'Access Problems' },
    { value: 'password', label: 'Password Reset' },
    { value: 'navigation', label: 'Navigation Help' },
    { value: 'features', label: 'Feature Questions' },
    { value: 'exam_generation', label: 'Exam Generation Issues' },
    { value: 'marks_entry', label: 'Marks Entry Problems' },
    { value: 'reports', label: 'Reports & Analytics' },
    { value: 'technical', label: 'Technical Issues' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <HelpCircle className="w-4 h-4" />
        Help
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Help & Support
            </DialogTitle>
            <DialogDescription>
              Get help with login, access, and using the system
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <BookOpen className="w-4 h-4 mr-2" />
                User Manual
              </TabsTrigger>
              <TabsTrigger value="support">
                <Send className="w-4 h-4 mr-2" />
                Submit Issue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>How to Login</CardTitle>
                  <CardDescription>Step-by-step guide to access your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">1. Navigate to Login Page</h4>
                    <p className="text-muted-foreground">Visit the CBC Academic System login page.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">2. Enter Credentials</h4>
                    <p className="text-muted-foreground">Enter your registered email and password in the respective fields.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">3. Sign In</h4>
                    <p className="text-muted-foreground">Click the "Sign In" button to access your dashboard.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">4. New User?</h4>
                    <p className="text-muted-foreground">If you don't have an account, click "Sign Up" to create a new institution account.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Overview</CardTitle>
                  <CardDescription>Understanding your user panel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Navigation Menu</h4>
                    <p className="text-muted-foreground">Access different sections using the sidebar menu including Dashboard, Students, Marks Entry, Reports, and Settings.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Quick Actions</h4>
                    <p className="text-muted-foreground">Use quick action buttons for common tasks like adding students or entering marks.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Profile Settings</h4>
                    <p className="text-muted-foreground">Update your institution details and preferences from the Settings menu.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting</CardTitle>
                  <CardDescription>Common issues and solutions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Forgot Password?</h4>
                    <p className="text-muted-foreground">Use the password reset link on the login page or submit a support ticket below.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Can't Access Features?</h4>
                    <p className="text-muted-foreground">Ensure your subscription is active. Contact support if issues persist.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Browser Compatibility</h4>
                    <p className="text-muted-foreground">Use modern browsers like Chrome, Firefox, or Edge for the best experience.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-4 mt-4">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={loading}
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+254712345678"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        required
                        disabled={loading}
                        maxLength={15}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issue_type">Issue Type *</Label>
                      <Select 
                        value={formData.issue_type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, issue_type: value }))}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {issueTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Please describe your issue in detail..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                        disabled={loading}
                        maxLength={1000}
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting Ticket...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Issue
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    We typically respond within 72 hours
                  </p>
                </form>
              ) : (
                <Card className="border-success">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                      <CardTitle>Ticket Submitted Successfully!</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">Your Ticket Number:</p>
                      <p className="text-2xl font-bold text-primary">{ticketNumber}</p>
                    </div>
                    <p className="text-muted-foreground">
                      Thank you for contacting us! We will get back to you within <strong>72 hours</strong>. 
                      Please save your ticket number for reference.
                    </p>
                    <Button onClick={resetForm} variant="outline" className="w-full">
                      Submit Another Issue
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
});

HelpButton.displayName = 'HelpButton';

export default HelpButton;