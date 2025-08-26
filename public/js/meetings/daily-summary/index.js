/**
 * Daily Summary - Main orchestrator for daily summary functionality
 * Converted from monolithic structure to modular components
 */

import { DateUtils } from './date-utils.js';
import { SummaryAPI } from './summary-api.js';
import { SummaryRenderer } from './summary-renderer.js';

export const DailySummary = {
    // State
    monthlySummaries: null,
    isGenerating: false,
    selectedPeriod: null,

    /**
     * Initialize the daily summary system
     */
    init() {
        this.selectedPeriod = DateUtils.getCurrentPeriod();
    },

    /**
     * Handle period selection change
     */
    onPeriodChange(value) {
        this.selectedPeriod = value;
        this.render();
    },

    /**
     * Handle generate button click
     */
    async onGenerateClick() {
        if (this.isGenerating) return;
        
        const [year, month] = this.selectedPeriod.split('-');
        await this.generateMonthlySummaries(parseInt(year), parseInt(month));
    },

    /**
     * Generate monthly summaries via API
     */
    async generateMonthlySummaries(year, month) {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.render();
        
        try {
            this.monthlySummaries = await SummaryAPI.generateMonthlySummaries(year, month);
        } catch (error) {
            alert(error.message);
        } finally {
            this.isGenerating = false;
            this.render();
        }
    },

    /**
     * Render the complete UI
     */
    render() {
        console.log('DailySummary.render() called');
        const container = document.getElementById('daily-summary-content');
        if (!container) {
            console.error('Container not found in render');
            return;
        }
        console.log('Container found, building HTML...');

        container.innerHTML = SummaryRenderer.renderMain(
            this.selectedPeriod,
            this.isGenerating,
            this.monthlySummaries
        );

        // Add event listeners
        this.attachEventListeners();
    },

    /**
     * Attach event listeners to rendered elements
     */
    attachEventListeners() {
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