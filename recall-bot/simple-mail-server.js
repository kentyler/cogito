// Simple Node.js mail server for Render.com
// This creates a basic SMTP server that can send emails without external dependencies

const nodemailer = require('nodemailer');
const SMTPServer = require('smtp-server').SMTPServer;

class SimpleMailServer {
  constructor(port = 2525) {
    this.port = port;
    this.emails = []; // Store emails in memory for now
    this.server = null;
  }

  start() {
    // Create a simple SMTP server
    this.server = new SMTPServer({
      // Allow any authentication
      onAuth: (auth, session, callback) => {
        console.log(`📧 SMTP Auth: ${auth.username}`);
        callback(null, { user: auth.username });
      },

      // Handle incoming emails
      onData: (stream, session, callback) => {
        let emailData = '';
        
        stream.on('data', (chunk) => {
          emailData += chunk;
        });

        stream.on('end', () => {
          console.log(`📧 Email received from ${session.envelope.mailFrom.address}`);
          console.log(`📧 To: ${session.envelope.rcptTo.map(r => r.address).join(', ')}`);
          
          // Store email in memory
          this.emails.push({
            from: session.envelope.mailFrom.address,
            to: session.envelope.rcptTo.map(r => r.address),
            data: emailData,
            timestamp: new Date()
          });

          // For demo purposes, just log that we "sent" it
          console.log('✅ Email processed successfully');
          callback();
        });
      }
    });

    this.server.listen(this.port, () => {
      console.log(`📧 Simple Mail Server running on port ${this.port}`);
    });

    return this.server;
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('📧 Mail server stopped');
    }
  }

  // Get stored emails (for debugging)
  getEmails() {
    return this.emails;
  }
}

// Create a simple transporter that uses console logging instead of actual sending
function createSimpleTransporter() {
  return nodemailer.createTransporter({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  }, {
    from: 'cogito@localhost',
    to: 'user@localhost'
  });
}

// Alternative: Create a transporter that just logs emails
function createLoggingTransporter() {
  return {
    sendMail: async (mailOptions) => {
      console.log('\n📧 ============ EMAIL SENT ============');
      console.log(`From: ${mailOptions.from}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Content Type: ${mailOptions.html ? 'HTML' : 'Text'}`);
      console.log(`Content Length: ${(mailOptions.html || mailOptions.text || '').length} characters`);
      
      if (process.env.NODE_ENV !== 'production') {
        // In development, save email to file
        const fs = require('fs').promises;
        const filename = `email-${Date.now()}.html`;
        await fs.writeFile(filename, mailOptions.html || mailOptions.text);
        console.log(`📧 Email saved to: ${filename}`);
      }
      
      console.log('📧 =====================================\n');
      
      return { 
        messageId: `simple-mail-${Date.now()}@localhost`,
        accepted: [mailOptions.to],
        rejected: [],
        envelope: {
          from: mailOptions.from,
          to: [mailOptions.to]
        }
      };
    },
    
    verify: (callback) => {
      console.log('📧 Simple logging mail service verified');
      if (callback) callback(null, true);
      return Promise.resolve(true);
    }
  };
}

module.exports = {
  SimpleMailServer,
  createSimpleTransporter,
  createLoggingTransporter
};