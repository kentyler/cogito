/**
 * Daily Summary - Main entry point for modular daily summary system
 * 
 * This file provides backward compatibility while delegating to the new modular structure.
 * For new development, use the modular components directly from ./daily-summary/
 */

import { DailySummary } from './daily-summary/index.js';

// Expose to global scope for backward compatibility
window.DailySummary = DailySummary;

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