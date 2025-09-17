/**
 * Invitation Email Service
 * Handles sending invitation emails to new members
 */
import { getEmailTransporter } from '../config/email.js';
import { DatabaseAgent } from '#database/database-agent.js';

export class InvitationEmailService {
  constructor() {
    this.dbAgent = new DatabaseAgent();
    this.dbAgentConnected = false;
  }

  async ensureDbAgent() {
    if (!this.dbAgentConnected) {
      await this.dbAgent.connect();
      this.dbAgentConnected = true;
    }
  }

  /**
   * Send invitation email to a new member
   * @param {Object} invitationData - Invitation details
   * @param {string} invitationData.recipientEmail - Email address to send invitation to
   * @param {string} invitationData.recipientName - Name of the person being invited
   * @param {string} invitationData.inviterName - Name of the person sending the invitation
   * @param {string} invitationData.inviterEmail - Email of the person sending the invitation
   * @param {string} invitationData.clientName - Name of the client/organization
   * @param {string} invitationData.invitationLink - Unique invitation link
   * @param {string} invitationData.personalMessage - Optional personal message from inviter
   */
  async sendInvitation(invitationData) {
    try {
      console.log(`📧 Preparing invitation email for: ${invitationData.recipientEmail}`);

      const {
        recipientEmail,
        recipientName = 'there',
        inviterName,
        inviterEmail,
        clientName = 'Cogito',
        invitationLink,
        personalMessage = ''
      } = invitationData;

      // Build the email content
      const htmlContent = this.buildInvitationHtml(invitationData);
      const textContent = this.buildInvitationText(invitationData);

      const mailOptions = {
        from: this.getFromAddress(),
        to: recipientEmail,
        replyTo: inviterEmail,
        subject: `${inviterName} invited you to join ${clientName} on Cogito`,
        html: htmlContent,
        text: textContent
      };

      console.log('📮 Sending invitation email...');

      const transporter = await getEmailTransporter();
      const result = await transporter.sendMail(mailOptions);

      console.log(`✅ Invitation email sent successfully to ${recipientEmail}`);
      console.log('📧 Message ID:', result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipientEmail
      };

    } catch (error) {
      console.error('❌ Error sending invitation email:', error);

      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Email delivery failed - connection refused');
        console.error('   This is normal in development/testing environments');
        return {
          success: false,
          error: 'Email service not configured (development mode)',
          recipientEmail: invitationData.recipientEmail
        };
      } else {
        console.error('💡 Unexpected email error:', error.message);
        throw error;
      }
    }
  }

  /**
   * Build HTML email content for invitation
   */
  buildInvitationHtml(data) {
    const {
      recipientName = 'there',
      inviterName,
      clientName = 'Cogito',
      invitationLink,
      personalMessage = ''
    } = data;

    const personalMessageHtml = personalMessage
      ? `<div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
           <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
           <p style="margin: 10px 0 0 0; color: #666;">- ${inviterName}</p>
         </div>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 20px; }
        .logo { font-size: 32px; font-weight: bold; color: #4CAF50; }
        .content { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background-color: #45a049; }
        .footer { margin-top: 30px; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .link-text { color: #4CAF50; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Cogito</div>
        </div>

        <div class="content">
            <h2>Hi ${recipientName}!</h2>

            <p><strong>${inviterName}</strong> has invited you to join <strong>${clientName}</strong> on Cogito, a conversational intelligence platform.</p>

            ${personalMessageHtml}

            <p>Click the button below to accept the invitation and create your account:</p>

            <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
            </div>

            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p class="link-text" style="font-size: 12px;">${invitationLink}</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

            <p style="color: #666; font-size: 14px;">
                This invitation will expire in 7 days. If you have any questions,
                please reply to this email to contact ${inviterName} directly.
            </p>
        </div>

        <div class="footer">
            <p>Cogito - Conversational Intelligence Platform</p>
            <p style="font-size: 12px;">
                You received this email because ${inviterName} invited you to join their team.
                If you believe this was sent in error, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
`;
  }

  /**
   * Build plain text email content for invitation
   */
  buildInvitationText(data) {
    const {
      recipientName = 'there',
      inviterName,
      clientName = 'Cogito',
      invitationLink,
      personalMessage = ''
    } = data;

    const personalMessageText = personalMessage
      ? `\nPersonal message from ${inviterName}:\n"${personalMessage}"\n`
      : '';

    return `Hi ${recipientName}!

${inviterName} has invited you to join ${clientName} on Cogito, a conversational intelligence platform.
${personalMessageText}
Accept the invitation by clicking the link below:
${invitationLink}

This invitation will expire in 7 days.

If you have any questions, please reply to this email to contact ${inviterName} directly.

---
Cogito - Conversational Intelligence Platform

You received this email because ${inviterName} invited you to join their team.
If you believe this was sent in error, you can safely ignore this email.`;
  }

  /**
   * Get email from address based on available configuration
   */
  getFromAddress() {
    return process.env.RESEND_FROM_EMAIL ?
      `"Cogito Invitations" <${process.env.RESEND_FROM_EMAIL}>` :
      process.env.GMAIL_USER ?
      `"Cogito Invitations" <${process.env.GMAIL_USER}>` :
      '"Cogito Invitations" <invitations@cogito.app>';
  }
}