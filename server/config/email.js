import nodemailer from 'nodemailer';

// Email transporter will be initialized when needed
let emailTransporter = null;

// Initialize email transporter with fallback methods
export async function getEmailTransporter() {
  if (emailTransporter) {
    return emailTransporter;
  }
  
  // Try Resend first if configured (recommended)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendTransporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });
      
      await resendTransporter.verify();
      console.log('✅ Resend email service configured successfully');
      emailTransporter = resendTransporter;
      return emailTransporter;
    } catch (error) {
      console.error('❌ Resend configuration failed:', error.message);
      console.error('❌ Check: 1) API key is correct 2) Domain is verified in Resend dashboard 3) FROM address uses verified domain');
    }
  }
  
  // Try Gmail SMTP if configured (requires app password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      await gmailTransporter.verify();
      console.log('✅ Gmail SMTP configured successfully');
      emailTransporter = gmailTransporter;
      return emailTransporter;
    } catch (error) {
      console.error('❌ Gmail SMTP configuration failed:', error);
    }
  }
  
  // Try direct SMTP second
  try {
    const directTransporter = nodemailer.createTransport({
      name: process.env.RENDER_EXTERNAL_URL || 'cogito-meetings.onrender.com',
      direct: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
    
    await directTransporter.verify();
    console.log('📧 Using direct SMTP transport');
    emailTransporter = directTransporter;
    return emailTransporter;
  } catch (error) {
    console.log('📧 Direct SMTP failed:', error.message);
  }
  
  console.log('📧 All configured email services failed - falling back to logging only');
  
  // Final fallback to logging
  emailTransporter = {
    sendMail: async (mailOptions) => {
      console.log('\n📧 ============ EMAIL LOGGED ============');
      console.log(`From: ${mailOptions.from}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Content Type: ${mailOptions.html ? 'HTML' : 'Text'}`);
      console.log(`Content Length: ${(mailOptions.html || mailOptions.text || '').length} characters`);
      console.log('📧 ======================================\n');
      
      return { 
        messageId: `logged-mail-${Date.now()}@localhost`,
        accepted: [mailOptions.to],
        rejected: [],
        envelope: {
          from: mailOptions.from,
          to: [mailOptions.to]
        }
      };
    },
    
    verify: () => {
      console.log('📧 Logging mail service verified');
      return Promise.resolve(true);
    }
  };
  
  return emailTransporter;
}

export default { getEmailTransporter };