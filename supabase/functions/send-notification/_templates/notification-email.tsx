import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NotificationEmailProps {
  title: string;
  message: string;
  recipientName: string;
  notificationType: string;
  actionUrl?: string;
}

export const NotificationEmail = ({
  title,
  message,
  recipientName,
  notificationType,
  actionUrl,
}: NotificationEmailProps) => {
  const getNotificationColor = () => {
    switch (notificationType) {
      case 'payment_reminder':
        return '#f59e0b';
      case 'deadline_reminder':
        return '#ef4444';
      case 'system_update':
        return '#3b82f6';
      default:
        return '#10b981';
    }
  };

  const getNotificationIcon = () => {
    switch (notificationType) {
      case 'payment_reminder':
        return '💰';
      case 'deadline_reminder':
        return '⏰';
      case 'system_update':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoSection}>
              <span style={logo}>CBC Pro Ranker</span>
            </div>
          </Section>

          <Section style={notificationBanner(getNotificationColor())}>
            <Text style={iconText}>{getNotificationIcon()}</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>{title}</Heading>
            
            <Text style={greeting}>Dear {recipientName},</Text>
            
            <Section style={messageBox}>
              <Text style={messageText}>
                {message.split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
              </Text>
            </Section>

            {actionUrl && (
              <Section style={buttonContainer}>
                <Link href={actionUrl} style={button}>
                  View Details
                </Link>
              </Section>
            )}

            <Hr style={divider} />

            <Text style={regards}>
              Best regards,
              <br />
              <strong>CBC Pro Ranker Admin Team</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from CBC Pro Ranker administrative system.
              <br />
              Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} CBC Pro Ranker. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NotificationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginTop: '32px',
  marginBottom: '32px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header = {
  backgroundColor: '#1e40af',
  padding: '24px',
};

const logoSection = {
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '-0.5px',
};

const notificationBanner = (color: string) => ({
  backgroundColor: color,
  padding: '16px',
  textAlign: 'center' as const,
});

const iconText = {
  fontSize: '48px',
  margin: '0',
  lineHeight: '1',
};

const content = {
  padding: '32px 24px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 16px',
};

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const messageBox = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #1e40af',
  borderRadius: '4px',
  padding: '20px',
  margin: '0 0 24px',
};

const messageText = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const regards = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '24px',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '8px 0',
  textAlign: 'center' as const,
};
