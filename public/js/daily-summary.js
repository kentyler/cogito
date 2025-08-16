// Daily Summary Tab - JavaScript implementation
// Converted from ClojureScript maintaining same functionality and formatting

window.DailySummary = {
    monthlySummaries: null,
    isGenerating: false,
    selectedPeriod: null,

    init() {
        const today = new Date();
        this.selectedPeriod = `${today.getFullYear()}-${today.getMonth()}`;
    },

    formatDate(dateStr) {
        if (!dateStr) return 'Unknown Date';
        
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    },

    getMonthYearOptions() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const options = [];

        for (let i = 0; i < 12; i++) {
            const targetDate = new Date(currentYear, currentMonth - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });
            
            options.push({
                value: `${year}-${month}`,
                label: `${monthName} ${year}`,
                year: year,
                month: month
            });
        }

        return options;
    },

    async generateMonthlySummaries(year, month) {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.render();
        
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
            this.monthlySummaries = data.summaries || {};
            
        } catch (error) {
            console.error('❌ Error generating monthly summaries:', error);
            alert('Failed to generate summaries: ' + error.message);
        } finally {
            this.isGenerating = false;
            this.render();
        }
    },

    onPeriodChange(value) {
        this.selectedPeriod = value;
        this.render();
    },

    onGenerateClick() {
        if (this.isGenerating) return;
        
        const [year, month] = this.selectedPeriod.split('-');
        this.generateMonthlySummaries(parseInt(year), parseInt(month));
    },

    renderSummaries() {
        if (this.isGenerating) {
            const [year, month] = this.selectedPeriod.split('-');
            const monthName = new Date(parseInt(year), parseInt(month)).toLocaleDateString('en-US', { month: 'long' });
            return `
                <div class="flex justify-center items-center py-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span class="text-gray-600">Generating daily summaries for ${monthName} ${year}...</span>
                </div>
            `;
        }

        if (!this.monthlySummaries || Object.keys(this.monthlySummaries).length === 0) {
            return `
                <div class="text-center py-12">
                    <p class="text-gray-500 mb-4">No summaries generated yet</p>
                    <p class="text-sm text-gray-400">Click 'Generate' to create AI summaries of this month's conversations</p>
                </div>
            `;
        }

        const sortedSummaries = Object.entries(this.monthlySummaries).sort();
        return `
            <div class="space-y-6">
                ${sortedSummaries.map(([date, summaryData]) => this.renderSummaryCard(date, summaryData)).join('')}
            </div>
        `;
    },

    renderSummaryCard(date, summaryData) {
        const formattedDate = this.formatSummaryDate(date);
        const summaryText = summaryData.summary || '';
        const paragraphs = summaryText.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);

        return `
            <div class="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <div class="mb-4">
                    <h4 class="text-xl font-semibold text-gray-800">${formattedDate}</h4>
                </div>
                <div class="text-gray-700 leading-relaxed space-y-3">
                    ${paragraphs.map(paragraph => `<p>${this.escapeHtml(paragraph)}</p>`).join('')}
                </div>
            </div>
        `;
    },

    formatSummaryDate(date) {
        try {
            // Handle ClojureScript keyword format (starts with :)
            const cleanDate = date.toString().startsWith(':') ? date.toString().substring(1) : date.toString();
            const dateObj = new Date(cleanDate + 'T00:00:00.000Z');
            return dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return `Date: ${date}`;
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    render() {
        console.log('DailySummary.render() called');
        const container = document.getElementById('daily-summary-content');
        if (!container) {
            console.error('Container not found in render');
            return;
        }
        console.log('Container found, building HTML...');

        const options = this.getMonthYearOptions();
        
        container.innerHTML = `
            <div class="daily-summary-tab h-full flex flex-col">
                <div class="header border-b pb-4 mb-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold text-gray-900">Daily Summary</h2>
                        <div class="flex items-center space-x-4">
                            <select class="text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    id="period-selector" ${this.isGenerating ? 'disabled' : ''}>
                                ${options.map(option => 
                                    `<option value="${option.value}" ${option.value === this.selectedPeriod ? 'selected' : ''}>${option.label}</option>`
                                ).join('')}
                            </select>
                            <button class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" 
                                    id="generate-button" ${this.isGenerating ? 'disabled' : ''}>
                                ${this.isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                            <p class="text-xs text-blue-500 font-mono">v2.3.0</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">AI summaries for selected month's conversations</p>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    ${this.renderSummaries()}
                </div>
            </div>
        `;

        // Add event listeners
        const periodSelector = document.getElementById('period-selector');
        const generateButton = document.getElementById('generate-button');

        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.onPeriodChange(e.target.value);
            });
        }

        if (generateButton) {
            generateButton.addEventListener('click', () => {
                this.onGenerateClick();
            });
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.DailySummary.init();
});

// Function to show daily summary tab
window.showDailySummary = function() {
    console.log('showDailySummary called');
    
    // The container already exists in the HTML, just show it and render
    const container = document.getElementById('daily-summary-content');
    if (container) {
        console.log('Daily summary container found, rendering...');
        window.DailySummary.render();
    } else {
        console.error('Daily summary container not found!');
    }
};