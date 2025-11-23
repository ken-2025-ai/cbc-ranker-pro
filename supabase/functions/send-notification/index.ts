import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { NotificationEmail } from './_templates/notification-email.tsx';

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
    console.log('=== Send Notification Function Called ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { notificationId, sessionToken }: NotificationRequest = await req.json();
    
    console.log('Parsed request data:', { notificationId, sessionToken: sessionToken ? 'present' : 'missing' });

    console.log('Verifying admin session with token:', sessionToken);
    
    // First, verify the session token in admin_sessions table
    const { data: session, error: sessionError } = await supabaseClient
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      console.error('Session verification failed:', sessionError);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        details: 'Invalid session token'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      console.error('Session expired');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        details: 'Session expired'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Now get the admin user details
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('id, email, full_name, is_active')
      .eq('id', session.admin_id)
      .single();

    if (adminError || !adminUser || !adminUser.is_active) {
      console.error('Admin verification failed:', adminError);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        details: adminError?.message || 'Admin user not found or inactive'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log('Admin user verified:', adminUser.email);

    // Get notification details
    const { data: notification, error: notificationError } = await supabaseClient
      .from('admin_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notificationError || !notification) {
      console.error('Notification fetch error:', notificationError);
      return new Response(JSON.stringify({ 
        error: 'Notification not found',
        details: notificationError?.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log('Found notification:', notification.title, 'Target type:', notification.target_type);

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

    console.log('Target institution IDs found:', institutionIds.length, 'institutions');

    // Get institution details for email sending
    const { data: institutions, error: instError } = await supabaseClient
      .from('admin_institutions')
      .select('id, name, email, headteacher_name')
      .in('id', institutionIds);

    if (instError) {
      console.error('Failed to fetch institution details:', instError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch institutions',
        details: instError.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('Fetched institution details for', institutions?.length || 0, 'institutions');

    let emailsSent = 0;
    let errors: string[] = [];

    // Create in-app notifications for users from target institutions
    let inAppNotificationsCreated = 0;
    if (notification.delivery_method.includes('in_app')) {
      console.log('Creating in-app notifications for', institutions?.length || 0, 'institutions');
      
      for (const institution of institutions || []) {
        try {
          const userIds: string[] = [];

          // Get institution owner from admin_institutions
          const { data: institutionData, error: instError } = await supabaseClient
            .from('admin_institutions')
            .select('user_id')
            .eq('id', institution.id)
            .single();

          if (institutionData?.user_id) {
            userIds.push(institutionData.user_id);
            console.log(`Found institution owner for ${institution.name}`);
          }

          // Get all staff members from institution_staff
          const { data: staffMembers, error: staffError } = await supabaseClient
            .from('institution_staff')
            .select('user_id')
            .eq('institution_id', institution.id)
            .eq('is_active', true);

          if (staffMembers && staffMembers.length > 0) {
            userIds.push(...staffMembers.map(s => s.user_id));
            console.log(`Found ${staffMembers.length} staff members for ${institution.name}`);
          }

          if (instError || staffError) {
            console.error(`Error fetching users for ${institution.name}:`, { instError, staffError });
          }

          console.log(`Total users found for ${institution.name}: ${userIds.length}`);

          // Create in-app notifications for each user
          if (userIds.length > 0) {
            const userNotifications = userIds.map(userId => ({
              user_id: userId,
              title: notification.title,
              message: notification.message,
              notification_type: notification.notification_type,
              priority: notification.notification_type === 'deadline_reminder' ? 'high' : 'normal',
              created_at: new Date().toISOString()
            }));

            console.log(`Inserting ${userNotifications.length} notifications for ${institution.name}`);

            const { data: insertedNotifications, error: notificationError } = await supabaseClient
              .from('user_notifications')
              .insert(userNotifications)
              .select();

            if (notificationError) {
              console.error(`Failed to create in-app notifications for ${institution.name}:`, notificationError);
              errors.push(`Failed to create notifications for ${institution.name}: ${notificationError.message}`);
            } else {
              console.log(`Successfully created ${insertedNotifications?.length || 0} notifications for ${institution.name}`);
              inAppNotificationsCreated += userNotifications.length;
            }
          } else {
            console.log(`No users found for institution ${institution.name}`);
          }
        } catch (error) {
          console.error(`Error processing institution ${institution.name}:`, error);
          errors.push(`Error processing ${institution.name}: ${error.message}`);
        }
      }
      
      console.log(`Total in-app notifications created: ${inAppNotificationsCreated}`);
    }

    // Send emails if email delivery is enabled
    if (notification.delivery_method.includes('email')) {
      console.log('Attempting to send emails to', institutions?.length || 0, 'institutions');
      
      for (const institution of institutions || []) {
        if (institution.email) {
          try {
            // Render React Email template
            const html = await renderAsync(
              React.createElement(NotificationEmail, {
                title: notification.title,
                message: notification.message,
                recipientName: institution.headteacher_name || institution.name || 'Administrator',
                notificationType: notification.notification_type,
                actionUrl: notification.target_type === 'payment_reminder' 
                  ? `https://tzdpqwkbkuqypzzuphmt.supabase.co` 
                  : undefined,
              })
            );

            const emailResult = await resend.emails.send({
              from: "CBC Pro Ranker <onboarding@resend.dev>",
              to: [institution.email],
              subject: notification.title,
              html,
            });
            
            console.log('Email sent successfully to', institution.email, 'Result:', emailResult);
            emailsSent++;
          } catch (error) {
            console.error(`Failed to send email to ${institution.email}:`, error);
            errors.push(`Failed to send email to ${institution.name}: ${error.message}`);
          }
        } else {
          console.log(`No email address for institution: ${institution.name}`);
        }
      }
    }

    // Update notification as sent
    const { error: updateError } = await supabaseClient
      .from('admin_notifications')
      .update({
        is_sent: true,
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (updateError) {
      console.error('Failed to update notification status:', updateError);
    } else {
      console.log('Notification marked as sent successfully');
    }

    // Log the activity
    await supabaseClient
      .from('admin_activity_logs')
      .insert({
        admin_id: adminUser.id,
        action_type: 'notification',
        description: `Sent notification "${notification.title}" to ${institutions?.length || 0} institutions (${emailsSent} emails sent, ${inAppNotificationsCreated} in-app notifications created)`,
        target_type: 'notification',
        target_id: notificationId,
        ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    console.log('=== Notification Send Summary ===');
    console.log(`Total institutions targeted: ${institutions?.length || 0}`);
    console.log(`Emails sent: ${emailsSent}`);
    console.log(`In-app notifications created: ${inAppNotificationsCreated}`);
    console.log(`Errors encountered: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Error details:', errors);
    }

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

  } catch (error: any) {
    console.error('=== Send notification error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});