import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  notificationId: string;
  sessionToken: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { notificationId, sessionToken }: NotificationRequest = await req.json();

    // Verify admin session
    const { data: session, error: sessionError } = await supabaseClient
      .from('admin_sessions')
      .select(`
        admin_users (
          id,
          email,
          full_name,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session || !session.admin_users.is_active) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Get notification details
    const { data: notification, error: notificationError } = await supabaseClient
      .from('admin_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notificationError || !notification) {
      return new Response(JSON.stringify({ error: 'Notification not found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Get target institutions
    let institutionIds: string[] = [];
    
    if (notification.target_type === 'all') {
      const { data: allInstitutions } = await supabaseClient
        .from('admin_institutions')
        .select('id');
      institutionIds = allInstitutions?.map(inst => inst.id) || [];
    } else if (notification.target_type === 'active_only') {
      const { data: activeInstitutions } = await supabaseClient
        .from('admin_institutions')
        .select('id')
        .eq('subscription_status', 'paid');
      institutionIds = activeInstitutions?.map(inst => inst.id) || [];
    } else if (notification.target_type === 'expired_only') {
      const { data: expiredInstitutions } = await supabaseClient
        .from('admin_institutions')
        .select('id')
        .in('subscription_status', ['expired', 'unpaid']);
      institutionIds = expiredInstitutions?.map(inst => inst.id) || [];
    } else {
      institutionIds = notification.target_institutions || [];
    }

    // Get institution details for email sending
    const { data: institutions, error: instError } = await supabaseClient
      .from('admin_institutions')
      .select('id, name, email, headteacher_name')
      .in('id', institutionIds);

    if (instError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch institutions' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    let emailsSent = 0;
    let errors: string[] = [];

    // Create in-app notifications for users from target institutions
    let inAppNotificationsCreated = 0;
    if (notification.delivery_method.includes('in_app')) {
      for (const institution of institutions || []) {
        try {
          // Get all users from this institution
          const { data: institutionUsers, error: usersError } = await supabaseClient
            .from('institution_users')
            .select('user_id')
            .eq('institution_id', institution.id);

          if (usersError) {
            console.error(`Failed to get users for institution ${institution.name}:`, usersError);
            continue;
          }

          // Create in-app notifications for each user
          if (institutionUsers && institutionUsers.length > 0) {
            const userNotifications = institutionUsers.map(iu => ({
              user_id: iu.user_id,
              title: notification.title,
              message: notification.message,
              notification_type: notification.notification_type,
              priority: notification.notification_type === 'deadline_reminder' ? 'high' : 'normal'
            }));

            const { error: notificationError } = await supabaseClient
              .from('user_notifications')
              .insert(userNotifications);

            if (notificationError) {
              console.error(`Failed to create in-app notifications for ${institution.name}:`, notificationError);
            } else {
              inAppNotificationsCreated += userNotifications.length;
            }
          }
        } catch (error) {
          console.error(`Error processing institution ${institution.name}:`, error);
        }
      }
    }

    // Send emails if email delivery is enabled
    if (notification.delivery_method.includes('email')) {
      for (const institution of institutions || []) {
        if (institution.email) {
          try {
            await resend.emails.send({
              from: "CBC Pro Ranker <noreply@cbcproranker.com>",
              to: [institution.email],
              subject: notification.title,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1e40af;">${notification.title}</h2>
                  <p>Dear ${institution.headteacher_name || 'Administrator'},</p>
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="line-height: 1.6; margin: 0;">${notification.message}</p>
                  </div>
                  <p>Best regards,<br>CBC Pro Ranker Admin Team</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  <p style="font-size: 12px; color: #64748b;">
                    This is an automated message from CBC Pro Ranker administrative system.
                  </p>
                </div>
              `,
            });
            emailsSent++;
          } catch (error) {
            console.error(`Failed to send email to ${institution.email}:`, error);
            errors.push(`Failed to send email to ${institution.name}`);
          }
        }
      }
    }

    // Update notification as sent
    await supabaseClient
      .from('admin_notifications')
      .update({
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    // Log the activity
    await supabaseClient
      .from('admin_activity_logs')
      .insert({
        admin_id: session.admin_users.id,
        action_type: 'notification',
        description: `Sent notification "${notification.title}" to ${institutions?.length || 0} institutions (${emailsSent} emails sent, ${inAppNotificationsCreated} in-app notifications created)`,
        target_type: 'notification',
        target_id: notificationId,
        ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    return new Response(JSON.stringify({
      message: 'Notification sent successfully',
      stats: {
        totalInstitutions: institutions?.length || 0,
        emailsSent,
        inAppNotificationsCreated,
        errors
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});