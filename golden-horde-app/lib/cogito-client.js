/**
 * Cogito API Client
 * Makes HTTP requests to main Cogito server for LLM responses
 */

class CogitoClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a message to the Golden Horde Collective via main Cogito
   */
  async sendMessage(message, userContext = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          context: 'golden-horde-interface',
          // Force Golden Horde avatar and client
          forceAvatar: 'golden_horde_collective',
          forceClient: 9, // Golden Horde client ID
          userEmail: userContext.email || 'anonymous@goldenhorde.app'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response || data.message || 'No response received',
        metadata: {
          model: 'claude-3-haiku', // We hardcoded this in the main server
          avatar: 'golden_horde_collective',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Cogito API error:', error);
      
      // Fallback response if main Cogito is down
      return {
        success: false,
        response: "We apologize, but the collective is temporarily unavailable. The nomadic nature of our intelligence sometimes requires us to regroup. Please try again in a moment.",
        error: error.message,
        metadata: {
          fallback: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Health check for main Cogito server
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default CogitoClient;