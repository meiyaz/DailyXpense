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

    // 1. History Exact Match (Highest Priority - User Habit)
    const historyExactMatch = recentExpenses.find(e =>
        e.type === type && e.description.toLowerCase() === text
    );
    if (historyExactMatch) {
        if (typeCategories.some(c => c.name === historyExactMatch.category)) {
            return historyExactMatch.category;
        }
    }

    // Prepare Keywords
    const categoryKeywords = typeCategories.map(cat => ({
        cat,
        allKeywords: [...(KEYWORD_MAP[cat.name] || []), cat.name.toLowerCase()]
    }));

    // 2. Keyword Exact Match (System Certainty)
    for (const { cat, allKeywords } of categoryKeywords) {
        if (allKeywords.some(k => text === k || text.split(' ').includes(k))) {
            return cat.name;
        }
    }

    // 3. Keyword Prefix/Strong Match (e.g. "pet" -> "petrol")
    // Prioritizing this over history fuzzy match fixes issues where 1 bad history entry 
    // biases prediction for a clear keyword prefix.
    if (text.length >= 2) {
        for (const { cat, allKeywords } of categoryKeywords) {
            if (allKeywords.some(k => k.startsWith(text) || (text.startsWith(k) && k.length > 3))) {
                return cat.name;
            }
        }
    }

    // 4. History Fuzzy Match (Fallback Learning)
    if (text.length > 3) {
        const historyFuzzyMatch = recentExpenses.find(e =>
            e.type === type && e.description.toLowerCase().includes(text)
        );
        if (historyFuzzyMatch) {
            if (typeCategories.some(c => c.name === historyFuzzyMatch.category)) {
                return historyFuzzyMatch.category;
            }
        }
    }

    // 5. Keyword Fuzzy Inclusion (Weakest)
    if (text.length > 3) {
        for (const { cat, allKeywords } of categoryKeywords) {
            if (allKeywords.some(k => text.includes(k) && k.length > 3)) {
                return cat.name;
            }
        }
    }

    return undefined;
}
