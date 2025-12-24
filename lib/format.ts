/**
 * Formats a number with comma separators for thousands and 2 decimal places.
 * Example: 1234.56 -> 1,234.56
 */
export const formatAmount = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return "0";

    const parts = amount.toFixed(2).split('.');

    // Indian numbering system logic: 
    // Last 3 digits grouped, then groups of 2
    let x = parts[0];
    let lastThree = x.substring(x.length - 3);
    let otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    if (parts[1] === '00') return res;
    return res + "." + parts[1];
};
