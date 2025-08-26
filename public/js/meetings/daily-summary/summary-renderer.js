/**
 * Summary Renderer - Handle HTML generation and rendering for daily summaries
 */

import { DateUtils } from './date-utils.js';

export const SummaryRenderer = {
    /**
     * Render loading state during generation
     */
    renderLoading(selectedPeriod) {
        const [year, month] = selectedPeriod.split('-');
        const monthName = new Date(parseInt(year), parseInt(month)).toLocaleDateString('en-US', { month: 'long' });
        return `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span class="text-gray-600">Generating daily summaries for ${monthName} ${year}...</span>
            </div>
        `;
    },

    /**
     * Render empty state when no summaries exist
     */
    renderEmpty() {
        return `
            <div class="text-center py-12">
                <p class="text-gray-500 mb-4">No summaries generated yet</p>
                <p class="text-sm text-gray-400">Click 'Generate' to create AI summaries of this month's conversations</p>
            </div>
        `;
    },

    /**
     * Render summaries content
     */
    renderSummaries(summaries, isGenerating, selectedPeriod) {
        if (isGenerating) {
            return this.renderLoading(selectedPeriod);
        }

        if (!summaries || Object.keys(summaries).length === 0) {
            return this.renderEmpty();
        }

        const sortedSummaries = Object.entries(summaries).sort();
        return `
            <div class="space-y-6">
                ${sortedSummaries.map(([date, summaryData]) => this.renderSummaryCard(date, summaryData)).join('')}
            </div>
        `;
    },

    /**
     * Render individual summary card
     */
    renderSummaryCard(date, summaryData) {
        const formattedDate = DateUtils.formatSummaryDate(date);
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

    /**
     * Render main UI structure
     */
    renderMain(selectedPeriod, isGenerating, summaries) {
        const options = DateUtils.getMonthYearOptions();
        
        return `
            <div class="daily-summary-tab h-full flex flex-col">
                <div class="header border-b pb-4 mb-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold text-gray-900">Daily Summary</h2>
                        <div class="flex items-center space-x-4">
                            <select class="text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    id="period-selector" ${isGenerating ? 'disabled' : ''}>
                                ${options.map(option => 
                                    `<option value="${option.value}" ${option.value === selectedPeriod ? 'selected' : ''}>${option.label}</option>`
                                ).join('')}
                            </select>
                            <button class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" 
                                    id="generate-button" ${isGenerating ? 'disabled' : ''}>
                                ${isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                            <p class="text-xs text-blue-500 font-mono">v2.3.0</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">AI summaries for selected month's conversations</p>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    ${this.renderSummaries(summaries, isGenerating, selectedPeriod)}
                </div>
            </div>
        `;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};