import { Category } from "../store/SettingsContext";
import { Expense } from "../store/ExpenseContext";

const KEYWORD_MAP: Record<string, string[]> = {
    "Transport": ["uber", "lyft", "taxi", "bus", "train", "metro", "fuel", "gas", "parking", "flight", "ticket", "cab", "ride"],
    "Food": ["coffee", "starbucks", "mcdonalds", "burger", "pizza", "sushi", "dining", "lunch", "dinner", "restaurant", "cafe", "bistro", "bar", "drinks", "food", "taco", "kfc", "dominos", "bread", "bakery", "restaurant"],
    "Shopping": ["amazon", "store", "mall", "clothes", "shoes", "gift", "book", "electronics", "apple", "gadget", "shop", "mart", "market"],
    "Entertainment": ["netflix", "spotify", "movie", "cinema", "game", "steam", "hulu", "disney", "concert", "event", "party", "show", "playstation", "xbox"],
    "Bills": ["rent", "electric", "water", "internet", "wifi", "bill", "subscription", "insurance", "tax", "mobile", "phone bill", "utility"],
    "Health": ["doctor", "pharmacy", "medicine", "drug", "hospital", "gym", "fitness", "workout", "therapy", "dental", "clinic", "health"],
    "Travel": ["hotel", "airbnb", "booking", "trip", "vacation", "tour", "visa", "passport", "flight"],
    "Tech": ["software", "hardware", "computer", "phone", "cloud", "server", "domain", "hosting", "app", "dev"],
    "Groceries": ["grocery", "groceries", "milk", "egg", "vegetable", "fruit", "market", "trader", "whole foods", "costco", "walmart"]
};

export function predictCategory(
    description: string,
    categories: Category[],
    recentExpenses: Expense[]
): string | undefined {
    const text = description.toLowerCase().trim();
    if (!text) return undefined;

    // 1. Check History (Exact match or starts with)
    // Find the most recent expense that matches this description
    const historyMatch = recentExpenses.find(e =>
        e.description.toLowerCase() === text ||
        (text.length > 3 && e.description.toLowerCase().startsWith(text))
    );
    if (historyMatch) {
        // Verify this category still exists in settings
        if (categories.some(c => c.name === historyMatch.category)) {
            return historyMatch.category;
        }
    }

    // 2. Keyword Matching
    for (const cat of categories) {
        const keywords = KEYWORD_MAP[cat.name] || [];
        // Add the category name itself as a keyword
        const allKeywords = [...keywords, cat.name.toLowerCase()];

        if (allKeywords.some(k => text.includes(k))) {
            return cat.name;
        }
    }

    return undefined;
}
