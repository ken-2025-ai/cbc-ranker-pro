import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, MessageCircle, AlertCircle } from "lucide-react";

export default function SubscriptionExpired() {
  const [formData, setFormData] = useState({
    institutionName: "",
    contactPerson: "",
    phone: "",
    email: "",
    mpesaCode: "",
    term: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('subscription_requests')
        .insert([{
          institution_name: formData.institutionName,
          contact_person: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          mpesa_code: formData.mpesaCode,
          term: formData.term,
          notes: formData.notes
        }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Payment request submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try contacting us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Request Received!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for submitting your payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              Our team will verify your payment and activate your subscription within 24 hours.
              You will receive a confirmation email once your subscription is active.
            </p>
            <div className="bg-muted/30 p-6 rounded-lg space-y-2">
              <h3 className="font-semibold text-lg">Need immediate assistance?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contact us directly for faster activation
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="mailto:kenkendagor3@gmail.com"
                  className="inline-flex items-center justify-center gap-2 text-sm hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  kenkendagor3@gmail.com
                </a>
                <a
                  href="tel:+254768731991"
                  className="inline-flex items-center justify-center gap-2 text-sm hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  +254 768 731 991
                </a>
                <a
                  href="https://wa.me/254768731991"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-destructive/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-3xl">Subscription Expired</CardTitle>
          <CardDescription className="text-lg">
            Your institution's subscription has expired. Please renew to continue using CBC Pro Ranker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="bg-muted/30 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Contact Us for Renewal</h3>
            <div className="grid gap-3">
              <a
                href="mailto:kenkendagor3@gmail.com"
                className="inline-flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Email</div>
                  <div className="text-muted-foreground">kenkendagor3@gmail.com</div>
                </div>
              </a>
              <a
                href="tel:+254768731991"
                className="inline-flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Phone</div>
                  <div className="text-muted-foreground">+254 768 731 991</div>
                </div>
              </a>
              <a
                href="https://wa.me/254768731991"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-muted-foreground">Chat with us directly</div>
                </div>
              </a>
            </div>
          </div>

          {/* Payment Request Form */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Already Paid? Submit Payment Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institutionName">Institution Name *</Label>
                  <Input
                    id="institutionName"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesaCode">M-PESA Code *</Label>
                  <Input
                    id="mpesaCode"
                    placeholder="e.g., QA12BC3456"
                    value={formData.mpesaCode}
                    onChange={(e) => setFormData({ ...formData, mpesaCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term</Label>
                  <Select value={formData.term} onValueChange={(value) => setFormData({ ...formData, term: value })}>
                    <SelectTrigger id="term">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T1">Term 1</SelectItem>
                      <SelectItem value="T2">Term 2</SelectItem>
                      <SelectItem value="T3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Payment Request"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
