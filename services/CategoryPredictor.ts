import { Category } from "../store/SettingsContext";
import { Expense } from "../store/ExpenseContext";

const KEYWORD_MAP: Record<string, string[]> = {
    "Transport": ["uber", "ola", "rapido", "cab", "auto", "train", "metro", "fuel", "petrol", "parking", "flight", "ticket", "bus", "bike", "taxi"],
    "Food": ["zomato", "swiggy", "starbucks", "mcdonalds", "kfc", "dominos", "pizza", "burger", "coffee", "tea", "chai", "restaurant", "cafe", "bistro", "snacks", "dinner", "lunch", "breakfast", "drinks"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "meesho", "store", "mall", "clothes", "shoes", "gift", "electronics", "gadget", "watch"],
    "Entertainment": ["netflix", "hotstar", "prime", "spotify", "movie", "cinema", "pvr", "inox", "game", "event", "concert"],
    "Bills": ["electricity", "water", "recharge", "mobile", "jio", "airtel", "vi", "wifi", "internet", "rent", "tax", "insurance", "emi", "society"],
    "Health": ["doctor", "medicine", "pharmacy", "hospital", "gym", "fitness", "yoga", "dental", "clinic", "apollo", "1mg"],
    "Travel": ["hotel", "airbnb", "trip", "vacation", "booking", "makemytrip", "goibibo", "irctc"],
    "Groceries": ["blinkit", "zepto", "bigbasket", "instamart", "milk", "vegetables", "fruit", "market", "grocery", "kirana"],
    // Income Specific
    "Salary": ["salary", "stipend", "paycheck", "credited", "payout"],
    "Freelance": ["fiverr", "upwork", "client", "project", "freelance"],
    "Service": ["refund", "interest", "dividend", "cashback", "service", "bonus"],
};

export function predictCategory(
    description: string,
    categories: Category[],
    recentExpenses: Expense[],
    type: 'expense' | 'income' = 'expense'
): string | undefined {
    const text = description.toLowerCase().trim();
    if (!text || text.length < 2) return undefined;

    // Filter categories by type first
    const typeCategories = categories.filter(c => (c.type || 'expense') === type);
    if (typeCategories.length === 0) return undefined;

    // 1. Check History (Exact match or starts with)
    // Find the most recent expense of the SAME TYPE that matches this description
    const historyMatch = recentExpenses
        .filter(e => e.type === type)
        .find(e =>
            e.description.toLowerCase() === text ||
            (text.length > 3 && e.description.toLowerCase().includes(text))
        );

    if (historyMatch) {
        // Verify this category still exists in settings and is the right type
        if (typeCategories.some(c => c.name === historyMatch.category)) {
            return historyMatch.category;
        }
    }

    // 2. Global Keyword Matching (Prioritized)
    const categoryKeywords = typeCategories.map(cat => ({
        cat,
        allKeywords: [...(KEYWORD_MAP[cat.name] || []), cat.name.toLowerCase()]
    }));

    // Priority 1: Exact word match across ALL categories
    for (const { cat, allKeywords } of categoryKeywords) {
        if (allKeywords.some(k => text.split(' ').includes(k) || text === k)) {
            return cat.name;
        }
    }

    // Priority 2: Prefix match across ALL categories (e.g. "pet" for "petrol")
    if (text.length >= 2) {
        for (const { cat, allKeywords } of categoryKeywords) {
            if (allKeywords.some(k => k.startsWith(text) || (text.startsWith(k) && k.length > 3))) {
                return cat.name;
            }
        }
    }

    // Priority 3: Fuzzy inclusion
    if (text.length > 3) {
        for (const { cat, allKeywords } of categoryKeywords) {
            if (allKeywords.some(k => text.includes(k) && k.length > 3)) {
                return cat.name;
            }
        }
    }

    return undefined;
}
