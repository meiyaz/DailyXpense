/**
 * Formats a number with comma separators for thousands and 2 decimal places.
 * Example: 1234.56 -> 1,234.56
 */
export const formatAmount = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) return "0";

    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);

    const parts = absAmount.toFixed(2).split('.');
    let x = parts[0];
    let res = "";

    if (x.length > 3) {
        let lastThree = x.substring(x.length - 3);
        let otherNumbers = x.substring(0, x.length - 3);
        res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    } else {
        res = x;
    }

    if (parts[1] !== '00') {
        res += "." + parts[1];
    }

    return isNegative ? "-" + res : res;
};
