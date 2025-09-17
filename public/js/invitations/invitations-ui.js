/**
 * Invitations UI - Manage client invitations
 * Handles sending invitations, viewing pending invitations, and revoking access
 */

class InvitationsUI {
  constructor() {
    this.container = document.getElementById('invitations-content');
    this.invitations = [];
    this.init();
  }

  init() {
    this.createUI();
    this.loadInvitations();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Team Invitations</h2>
          <button id="send-invitation-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Send Invitation
          </button>
        </div>

        <!-- Send Invitation Form (hidden by default) -->
        <div id="invitation-form" class="hidden mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-medium mb-4">Send New Invitation</h3>
          <form id="send-invitation-form" class="space-y-4">
            <div>
              <label for="invitation-email" class="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" id="invitation-email" required
                     class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label for="recipient-name" class="block text-sm font-medium text-gray-700">Recipient Name (Optional)</label>
              <input type="text" id="recipient-name"
                     class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label for="personal-message" class="block text-sm font-medium text-gray-700">Personal Message (Optional)</label>
              <textarea id="personal-message" rows="3"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add a personal note to the invitation..."></textarea>
            </div>
            <div class="flex space-x-3">
              <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Send Invitation
              </button>
              <button type="button" id="cancel-invitation-btn" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Filter Controls -->
        <div class="mb-4 flex space-x-4">
          <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-md">
            <option value="">All Invitations</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <button id="refresh-invitations" class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            Refresh
          </button>
        </div>

        <!-- Invitations List -->
        <div id="invitations-list" class="space-y-3">
          <div class="text-center py-8 text-gray-500">
            <div class="spinner mb-2">Loading invitations...</div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Show/hide invitation form
    document.getElementById('send-invitation-btn').addEventListener('click', () => {
      document.getElementById('invitation-form').classList.remove('hidden');
    });

    document.getElementById('cancel-invitation-btn').addEventListener('click', () => {
      document.getElementById('invitation-form').classList.add('hidden');
      document.getElementById('send-invitation-form').reset();
    });

    // Send invitation form
    document.getElementById('send-invitation-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendInvitation();
    });

    // Status filter
    document.getElementById('status-filter').addEventListener('change', () => {
      this.loadInvitations();
    });

    // Refresh button
    document.getElementById('refresh-invitations').addEventListener('click', () => {
      this.loadInvitations();
    });
  }

  async sendInvitation() {
    const email = document.getElementById('invitation-email').value;
    const recipientName = document.getElementById('recipient-name').value;
    const personalMessage = document.getElementById('personal-message').value;

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          recipientName,
          personalMessage
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification('Invitation sent successfully!', 'success');
        document.getElementById('invitation-form').classList.add('hidden');
        document.getElementById('send-invitation-form').reset();
        this.loadInvitations(); // Refresh the list
      } else {
        this.showNotification(result.error || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      this.showNotification('Failed to send invitation', 'error');
    }
  }

  async loadInvitations() {
    const listContainer = document.getElementById('invitations-list');
    const statusFilter = document.getElementById('status-filter').value;

    try {
      listContainer.innerHTML = '<div class="text-center py-4 text-gray-500">Loading...</div>';

      const url = statusFilter ? `/api/invitations/list?status=${statusFilter}` : '/api/invitations/list';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        this.invitations = result.data.invitations;
        this.renderInvitations();
      } else {
        listContainer.innerHTML = `<div class="text-center py-4 text-red-500">Error: ${result.error}</div>`;
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      listContainer.innerHTML = '<div class="text-center py-4 text-red-500">Failed to load invitations</div>';
    }
  }

  renderInvitations() {
    const listContainer = document.getElementById('invitations-list');

    if (this.invitations.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p>No invitations found.</p>
          <p class="text-sm mt-2">Click "Send Invitation" to invite team members.</p>
        </div>
      `;
      return;
    }

    const invitationsHTML = this.invitations.map(invitation => this.renderInvitation(invitation)).join('');
    listContainer.innerHTML = invitationsHTML;

    // Bind revoke buttons
    this.invitations.forEach(invitation => {
      if (invitation.status === 'pending') {
        const revokeBtn = document.getElementById(`revoke-${invitation.id}`);
        if (revokeBtn) {
          revokeBtn.addEventListener('click', () => this.revokeInvitation(invitation.id));
        }
      }
    });
  }

  renderInvitation(invitation) {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800'
    };

    const statusColor = statusColors[invitation.status] || 'bg-gray-100 text-gray-800';
    const createdDate = new Date(invitation.created_at).toLocaleDateString();
    const expiresDate = invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'N/A';

    return `
      <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <h4 class="font-medium text-gray-900">${invitation.email}</h4>
              <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
                ${invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </span>
            </div>
            ${invitation.recipient_name ? `<p class="text-sm text-gray-600 mt-1">${invitation.recipient_name}</p>` : ''}
            <div class="text-sm text-gray-500 mt-2 space-y-1">
              <div>Invited by: ${invitation.inviter_email || 'Unknown'}</div>
              <div>Sent: ${createdDate}</div>
              ${invitation.status === 'pending' ? `<div>Expires: ${expiresDate}</div>` : ''}
              ${invitation.accepted_at ? `<div>Accepted: ${new Date(invitation.accepted_at).toLocaleDateString()}</div>` : ''}
            </div>
            ${invitation.personal_message ? `
              <div class="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                <strong>Message:</strong> ${invitation.personal_message}
              </div>
            ` : ''}
          </div>
          <div class="flex space-x-2">
            ${invitation.status === 'pending' ? `
              <button id="revoke-${invitation.id}"
                      class="text-red-600 hover:text-red-800 text-sm font-medium">
                Revoke
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async revokeInvitation(invitationId) {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invitations/revoke/${invitationId}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification('Invitation revoked successfully', 'success');
        this.loadInvitations(); // Refresh the list
      } else {
        this.showNotification(result.error || 'Failed to revoke invitation', 'error');
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      this.showNotification('Failed to revoke invitation', 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Expose InvitationsUI class to global scope
window.InvitationsUI = InvitationsUI;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize when invitations tab is shown
  const initializeInvitations = () => {
    if (!window.invitationsUI) {
      window.invitationsUI = new InvitationsUI();
    }
  };

  // Check if invitations tab is already active
  const invitationsContent = document.getElementById('invitations-content');
  if (invitationsContent && !invitationsContent.classList.contains('hidden')) {
    initializeInvitations();
  }

  // Listen for tab changes
  document.addEventListener('tabChanged', (event) => {
    if (event.detail.tabId === 'invitations') {
      initializeInvitations();
    }
  });
});