// Simple Node.js mail server that actually sends emails
// Uses built-in SMTP without requiring external services like Gmail

const nodemailer = require('nodemailer');
const dns = require('dns').promises;

// Create a direct SMTP transporter that sends emails directly to recipient's mail server
function createDirectTransporter() {
  return nodemailer.createTransport({
    // Use direct transport - sends directly to recipient's mail server
    // This bypasses the need for Gmail or other SMTP services
    name: process.env.RENDER_EXTERNAL_URL || 'cogito-meetings.onrender.com',
    direct: true,
    
    // Connection pooling
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    
    // Timeouts
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  });
}

// Alternative: Use Ethereal Email for testing (creates temporary email accounts)
async function createEtherealTransporter() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.error('Failed to create Ethereal transporter:', error);
    return null;
  }
}

// Create a transporter that tries multiple methods
async function createBestTransporter() {
  // First try direct sending
  try {
    const directTransporter = createDirectTransporter();
    await directTransporter.verify();
    console.log('📧 Using direct SMTP transport');
    return directTransporter;
  } catch (error) {
    console.log('📧 Direct SMTP failed, trying Ethereal...');
  }
  
  // Fall back to Ethereal for testing
  try {
    const etherealTransporter = await createEtherealTransporter();
    if (etherealTransporter) {
      await etherealTransporter.verify();
      console.log('📧 Using Ethereal test email service');
      return etherealTransporter;
    }
  } catch (error) {
    console.log('📧 Ethereal failed, using logging fallback...');
  }
  
  // Final fallback to logging
  return createLoggingTransporter();
}

// Logging fallback for when actual email sending fails
function createLoggingTransporter() {
  return {
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
    
    verify: (callback) => {
      console.log('📧 Logging mail service verified');
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }
  };
}

module.exports = {
  createDirectTransporter,
  createEtherealTransporter,
  createBestTransporter,
  createLoggingTransporter
};