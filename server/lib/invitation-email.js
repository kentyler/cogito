import { getEmailTransporter } from '../config/email.js';

export async function sendInvitationEmail(email, inviterEmail, invitationToken) {
  const invitationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/invitation/${invitationToken}`;
  const transporter = await getEmailTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Cogito" <noreply@cogito-meetings.com>',
    to: email,
    subject: 'You\'ve been invited to Cogito',
    html: `
      <h2>You've been invited to join Cogito</h2>
      <p>You've been invited by ${inviterEmail} to join their team on Cogito.</p>
      <p>Click the link below to set up your password and get started:</p>
      <p><a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background: #4A90E2; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
      <p>This invitation will expire in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `,
    text: `
      You've been invited to join Cogito
      
      You've been invited by ${inviterEmail} to join their team on Cogito.
      
      Click the link below to set up your password and get started:
      ${invitationUrl}
      
      This invitation will expire in 7 days.
      
      If you didn't expect this invitation, you can safely ignore this email.
    `
  };
  
  return await transporter.sendMail(mailOptions);
}