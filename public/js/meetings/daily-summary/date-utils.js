/**
 * Date Utilities for Daily Summary
 * Handles date formatting and period selection logic
 */

export const DateUtils = {
    /**
     * Format date string for display
     */
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

    /**
     * Format summary date specifically
     */
    formatSummaryDate(date) {
        try {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return date;
        }
    },

    /**
     * Generate month/year options for period selector
     */
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

    /**
     * Get current period for initialization
     */
    getCurrentPeriod() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth()}`;
    }
};