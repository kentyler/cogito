// Query management for Cogito sidebar
class QueryManager {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  async handleQuery() {
    const queryInput = document.getElementById('query-input');
    const query = queryInput.value.trim();
    
    if (!query) return;
    
    const submitBtn = document.getElementById('submit-query');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.loading-spinner');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
      const response = await fetch(`${this.sidebar.baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sidebar.authToken}`,
          'Content-Type': 'application/json',
          'X-Client-ID': this.sidebar.currentClient?.client_id
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) throw new Error('Query failed');
      
      const result = await response.json();
      this.displayResponse(result.response);
      
    } catch (error) {
      this.displayResponse(`Error: ${error.message}`, true);
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  displayResponse(content, isError = false) {
    const responseArea = document.getElementById('response-area');
    const responseContent = document.getElementById('response-content');
    
    responseArea.classList.remove('hidden');
    responseContent.textContent = content;
    
    if (isError) {
      responseContent.style.color = '#dc2626';
    } else {
      responseContent.style.color = '#4b5563';
    }
  }

  clearResponse() {
    document.getElementById('response-area').classList.add('hidden');
    document.getElementById('response-content').textContent = '';
    document.getElementById('query-input').value = '';
  }
}