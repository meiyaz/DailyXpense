import { Expense } from "../store/ExpenseContext";

export interface Insight {
    type: 'velocity' | 'projection' | 'alert' | 'tip';
    title: string;
    message: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    icon: string;
    details?: string; // e.g. "Daily Avg: $50"
}

export const InsightsService = {
    getInsights: (expenses: Expense[], currency: string = '₹'): Insight[] => {
        const insights: Insight[] = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter Expenses
        const thisMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.type !== 'income';
        });

        const lastMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            // Handle January edge case
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && e.type !== 'income';
        });

        const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const daysInLastMonth = new Date(currentYear, currentMonth, 0).getDate();
        const dailyAvgLastMonth = totalLastMonth / daysInLastMonth;

        // 1. Spending Velocity
        if (totalLastMonth > 0) {
            const dayOfMonth = now.getDate();
            const dailyAvgThisMonth = totalThisMonth / Math.max(1, dayOfMonth);

            const percentDiff = ((dailyAvgThisMonth - dailyAvgLastMonth) / dailyAvgLastMonth) * 100;

            if (percentDiff > 10) {
                insights.push({
                    type: 'velocity',
                    title: 'Spending Up',
                    message: `You're spending ${Math.abs(Math.round(percentDiff))}% faster than last month.`,
                    sentiment: 'negative',
                    icon: 'trending-up',
                    details: `Daily Avg: ${currency}${Math.round(dailyAvgThisMonth)} (vs ${currency}${Math.round(dailyAvgLastMonth)})`
                });
            } else if (percentDiff < -10) {
                insights.push({
                    type: 'velocity',
                    title: 'On Track',
                    message: `You're spending ${Math.abs(Math.round(percentDiff))}% less than last month.`,
                    sentiment: 'positive',
                    icon: 'trending-down',
                    details: `Daily Avg: ${currency}${Math.round(dailyAvgThisMonth)} (vs ${currency}${Math.round(dailyAvgLastMonth)})`
                });
            }
        }

        // 2. Monthly Projection
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const daysRemaining = daysInCurrentMonth - dayOfMonth;

        if (totalThisMonth > 0 && dayOfMonth > 1) { // Need at least a day of data
            const dailyAvg = totalThisMonth / dayOfMonth;
            const projected = dailyAvg * daysInCurrentMonth;

            insights.push({
                type: 'projection',
                title: 'End of Month',
                message: `Projected spend: ${currency}${Math.round(projected)}`,
                sentiment: 'neutral',
                icon: 'calendar',
                details: `${daysRemaining} days left • Avg ${currency}${Math.round(dailyAvg)}/day`
            });
        }

        // 3. Category Alert
        const categoryTotals: Record<string, number> = {};
        thisMonthExpenses.forEach(e => {
            const cat = e.category || "Uncategorized";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
        });

        Object.entries(categoryTotals).forEach(([cat, amount]) => {
            const pct = amount / totalThisMonth;
            if (totalThisMonth > 0 && pct > 0.40) { // > 40% of spend
                insights.push({
                    type: 'alert',
                    title: 'High Spend Category',
                    message: `${cat} dominates ${Math.round(pct * 100)}% of expenses.`,
                    sentiment: 'negative',
                    icon: 'alert-circle',
                    details: `Spent ${currency}${amount} on ${cat}`
                });
            }
        });

        // Fail-safe
        if (insights.length === 0) {
            insights.push({
                type: 'tip',
                title: 'Smart Tip',
                message: "Track closer to unlock insights.",
                sentiment: 'neutral',
                icon: 'bulb',
                details: "Add more expenses to see trends."
            });
        }

        return insights.slice(0, 5); // Limit to top 5
    }
};
