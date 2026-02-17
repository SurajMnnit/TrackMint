/**
 * Currency configuration.
 *
 * Instead of hardcoding INR, the currency is read from the CURRENCY env var.
 * Each supported currency defines its symbol, subunit name, and subunit factor.
 */

const CURRENCIES = {
    INR: { code: 'INR', symbol: '₹', subunit: 'paise', factor: 100 },
    USD: { code: 'USD', symbol: '$', subunit: 'cents', factor: 100 },
    EUR: { code: 'EUR', symbol: '€', subunit: 'cents', factor: 100 },
    GBP: { code: 'GBP', symbol: '£', subunit: 'pence', factor: 100 },
    JPY: { code: 'JPY', symbol: '¥', subunit: 'yen', factor: 1 },
};

function getCurrency() {
    const code = (process.env.CURRENCY || 'INR').toUpperCase();
    const currency = CURRENCIES[code];
    if (!currency) {
        console.warn(`Unsupported currency "${code}", falling back to INR.`);
        return CURRENCIES.INR;
    }
    return currency;
}

/**
 * Convert a major-unit amount (e.g. rupees) to subunit integer (e.g. paise).
 */
function toSubunit(amount) {
    const currency = getCurrency();
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (typeof n !== 'number' || isNaN(n) || !isFinite(n) || n <= 0) {
        throw new Error('Amount must be a positive finite number.');
    }
    return Math.round(n * currency.factor);
}

/**
 * Convert subunit integer back to major-unit string.
 */
function fromSubunit(subunit) {
    const currency = getCurrency();
    if (currency.factor === 1) return String(subunit);
    return (subunit / currency.factor).toFixed(2);
}

module.exports = { getCurrency, toSubunit, fromSubunit, CURRENCIES };
