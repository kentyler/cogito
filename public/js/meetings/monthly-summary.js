// Monthly Summary Tab - JavaScript implementation
// Simplified version following daily-summary modular pattern

window.MonthlySummary = {
    yearlySummaries: null,
    isGenerating: false,
    selectedYear: null,

    init() {
        const today = new Date();
        this.selectedYear = today.getFullYear();
    },

    getYearOptions() {
        const currentYear = new Date().getFullYear();
        const options = [];
        for (let i = 0; i < 5; i++) {
            const year = currentYear - i;
            options.push({ value: year, label: year.toString() });
        }
        return options;
    },

    async generateYearlySummaries(year) {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.render();
        
        try {
            const response = await fetch('/api/generate-yearly-summaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year: year }),
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('user');
                    document.getElementById('loginForm').classList.remove('hidden');
                    document.getElementById('mainContent').classList.add('hidden');
                    throw new Error('Session expired - please log in again');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.yearlySummaries = data.summaries || {};
            
        } catch (error) {
            console.error('❌ Error generating yearly summaries:', error);
            alert('Failed to generate summaries: ' + error.message);
        } finally {
            this.isGenerating = false;
            this.render();
        }
    },

    onYearChange(value) {
        this.selectedYear = parseInt(value);
        this.render();
    },

    onGenerateClick() {
        if (this.isGenerating) return;
        this.generateYearlySummaries(this.selectedYear);
    },

    renderSummaries() {
        if (this.isGenerating) {
            return `
                <div class="flex justify-center items-center py-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span class="text-gray-600">Generating monthly summaries for ${this.selectedYear}...</span>
                </div>`;
        }

        if (!this.yearlySummaries || Object.keys(this.yearlySummaries).length === 0) {
            return `
                <div class="text-center py-12">
                    <p class="text-gray-500 mb-4">No summaries generated yet</p>
                    <p class="text-sm text-gray-400">Click 'Generate' to create AI summaries of this year's conversations by month</p>
                </div>`;
        }

        const sortedSummaries = Object.entries(this.yearlySummaries).sort();
        return `<div class="space-y-6">
            ${sortedSummaries.map(([month, summaryData]) => this.renderSummaryCard(month, summaryData)).join('')}
        </div>`;
    },

    renderSummaryCard(month, summaryData) {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
            month: 'long', year: 'numeric' 
        });
        
        const summaryText = summaryData.summary || '';
        const paragraphs = summaryText.split('\\\\n\\\\n').map(p => p.trim()).filter(p => p.length > 0);

        return `
            <div class="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <div class="mb-4">
                    <h4 class="text-xl font-semibold text-gray-800">${monthName}</h4>
                    <div class="text-sm text-gray-500 mt-1">
                        ${summaryData.turnCount || 0} conversations • 
                        ${summaryData.userTurns || 0} user messages • 
                        ${summaryData.assistantTurns || 0} assistant responses
                    </div>
                </div>
                <div class="text-gray-700 leading-relaxed space-y-3">
                    ${paragraphs.map(paragraph => `<p>${this.escapeHtml(paragraph)}</p>`).join('')}
                </div>
            </div>`;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    render() {
        const container = document.getElementById('monthly-summary-content');
        if (!container) return;

        const options = this.getYearOptions();
        container.innerHTML = `
            <div class="monthly-summary-tab h-full flex flex-col">
                <div class="header border-b pb-4 mb-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold text-gray-900">Monthly Summary</h2>
                        <div class="flex items-center space-x-4">
                            <select class="text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    id="year-selector" ${this.isGenerating ? 'disabled' : ''}>
                                ${options.map(option => 
                                    `<option value="${option.value}" ${option.value === this.selectedYear ? 'selected' : ''}>${option.label}</option>`
                                ).join('')}
                            </select>
                            <button class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" 
                                    id="generate-monthly-button" ${this.isGenerating ? 'disabled' : ''}>
                                ${this.isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                            <p class="text-xs text-blue-500 font-mono">v2.3.0</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">AI summaries for each month of the selected year</p>
                </div>
                <div class="flex-1 overflow-y-auto p-4">${this.renderSummaries()}</div>
            </div>`;

        // Add event listeners
        const yearSelector = document.getElementById('year-selector');
        const generateButton = document.getElementById('generate-monthly-button');

        if (yearSelector) {
            yearSelector.addEventListener('change', (e) => this.onYearChange(e.target.value));
        }
        if (generateButton) {
            generateButton.addEventListener('click', () => this.onGenerateClick());
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => window.MonthlySummary.init());

// Function to show monthly summary tab
window.showMonthlySummary = function() {
    const container = document.getElementById('monthly-summary-content');
    if (container) {
        window.MonthlySummary.render();
    } else {
        console.error('Monthly summary container not found!');
    }
};