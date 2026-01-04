/**
 * Formats a number with comma separators for thousands and 2 decimal places.
 * Example: 1234.56 -> 1,234.56
 */
export const formatAmount = (amount: number, locale: string = 'en-IN'): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return "0.00";

    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
        // Fallback to basic fixed point if Intl fails (unlikely)
        return amount.toFixed(2);
    }
};
