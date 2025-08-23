-- Create admin_notifications table for notification management
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'general',
    target_type TEXT NOT NULL DEFAULT 'all',
    target_institutions UUID[] DEFAULT ARRAY[]::UUID[],
    sent_by UUID REFERENCES admin_users(id),
    delivery_method TEXT[] DEFAULT ARRAY['in_app'],
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage notifications"
ON public.admin_notifications
FOR ALL
TO public
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();