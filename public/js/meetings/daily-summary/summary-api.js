/**
 * Summary API - Handle server communication for daily summaries
 */

export const SummaryAPI = {
    /**
     * Generate monthly summaries from server
     */
    async generateMonthlySummaries(year, month) {
        try {
            const response = await fetch('/api/generate-monthly-summaries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ year: year, month: month }),
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Session expired, redirecting to login');
                    localStorage.removeItem('user');
                    document.getElementById('loginForm').classList.remove('hidden');
                    document.getElementById('mainContent').classList.add('hidden');
                    throw new Error('Session expired - please log in again');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.summaries || {};
            
        } catch (error) {
            console.error('❌ Error generating monthly summaries:', error);
            throw new Error('Failed to generate summaries: ' + error.message);
        }
    }
};