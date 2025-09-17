#!/usr/bin/env node

/**
 * Test script to preview invitation email content
 * Usage: node scripts/test-invitation-email-preview.js
 */

import 'dotenv/config';
import { InvitationEmailService } from '../server/services/invitation-email-service.js';
import crypto from 'crypto';
import fs from 'fs';

async function previewInvitationEmail() {
  console.log('🧪 Testing Invitation Email Content Preview\n');

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

  // Build the email content
  const htmlContent = invitationService.buildInvitationHtml(testInvitation);
  const textContent = invitationService.buildInvitationText(testInvitation);

  console.log('📧 INVITATION EMAIL PREVIEW\n');
  console.log('='.repeat(60));
  console.log('PLAIN TEXT VERSION:');
  console.log('='.repeat(60));
  console.log(textContent);
  console.log('\n');

  // Save HTML version to a file for viewing
  const htmlFile = '/tmp/invitation-preview.html';
  fs.writeFileSync(htmlFile, htmlContent);

  console.log('='.repeat(60));
  console.log('HTML VERSION:');
  console.log('='.repeat(60));
  console.log(`HTML content saved to: ${htmlFile}`);
  console.log('You can open this file in a browser to see the styled email');
  console.log('\nHTML length:', htmlContent.length, 'characters');

  process.exit(0);
}

// Run the preview
previewInvitationEmail().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});