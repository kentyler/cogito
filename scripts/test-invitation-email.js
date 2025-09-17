#!/usr/bin/env node

/**
 * Test script for invitation email functionality
 * Usage: node scripts/test-invitation-email.js
 */

import 'dotenv/config';
import { InvitationEmailService } from '../server/services/invitation-email-service.js';
import crypto from 'crypto';

async function testInvitationEmail() {
  console.log('🧪 Testing Invitation Email Service\n');
  console.log('📧 Recipient: ken@8thfold.com\n');

  const invitationService = new InvitationEmailService();

  // Generate a test invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const invitationLink = `${baseUrl}/invite/accept?token=${invitationToken}`;

  const testInvitation = {
    recipientEmail: 'ken@8thfold.com',
    recipientName: 'Ken',
    inviterName: 'Test Admin',
    inviterEmail: 'admin@cogito.app',
    clientName: 'Test Organization',
    invitationLink: invitationLink,
    personalMessage: 'Welcome to our team! Looking forward to collaborating with you on Cogito.'
  };

  console.log('📋 Invitation Details:');
  console.log('   From:', testInvitation.inviterName, `<${testInvitation.inviterEmail}>`);
  console.log('   To:', testInvitation.recipientName, `<${testInvitation.recipientEmail}>`);
  console.log('   Organization:', testInvitation.clientName);
  console.log('   Message:', testInvitation.personalMessage);
  console.log('   Link:', invitationLink);
  console.log('');

  try {
    console.log('📮 Sending invitation email...\n');
    const result = await invitationService.sendInvitation(testInvitation);

    if (result.success) {
      console.log('✅ SUCCESS! Invitation email sent');
      console.log('   Message ID:', result.messageId);
      console.log('   Recipient:', result.recipientEmail);
      console.log('\n📬 Check the inbox for ken@8thfold.com');
    } else {
      console.log('⚠️  Email not sent (likely in development mode)');
      console.log('   Reason:', result.error);
      console.log('\n💡 To send real emails, configure one of:');
      console.log('   - RESEND_API_KEY and RESEND_FROM_EMAIL');
      console.log('   - GMAIL_USER and GMAIL_APP_PASSWORD');
    }

  } catch (error) {
    console.error('❌ ERROR sending invitation email:');
    console.error('   ', error.message);
    console.error('\n💡 Check your email configuration in .env file');
  }

  process.exit(0);
}

// Run the test
testInvitationEmail().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});