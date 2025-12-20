const fs = require('fs');
const path = require('path');

const generateData = () => {
    const today = new Date();
    const categories = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Tech", "Travel"];
    const descriptions = [
        "Morning Coffee", "Uber to Work", "Groceries", "Movie Night", "Internet Bill",
        "Gym Membership", "Team Lunch", "Dinner Date", "Gas Station", "Netflix",
        "Spotify", "Amazon Order", "Pharmacy", "Flight Ticket", "Hotel Booking", "Concert"
    ];

    const expenses = [];

    // Helper to generate a unique ID
    const generateId = (prefix) => {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // Helper to add random expenses for a specific date range
    const addExpensesForDate = (dateOb, count) => {
        for (let j = 0; j < count; j++) {
            expenses.push({
                id: generateId(`exp_${dateOb.getTime()}_${j}`), // Robust unique ID
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                amount: parseFloat((Math.random() * 80 + 10).toFixed(2)),
                tag: categories[Math.floor(Math.random() * categories.length)],
                date: dateOb.toISOString()
            });
        }
    };

    // 1. Daily View: Ensure EVERY DAY of the last 7 days has data
    console.log("Generating Daily Data...");
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        // Add 3-5 items per day explicitly
        addExpensesForDate(d, Math.floor(Math.random() * 3) + 3);
    }

    // 2. Monthly View: Ensure EVERY MONTH of the last 6 months has data
    console.log("Generating Monthly Data...");
    for (let i = 0; i < 6; i++) {
        // Pick a random day in each of the last 6 months
        const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
        // Add 10-15 items per month (scattered)
        for (let k = 0; k < 12; k++) {
            const scatterDay = new Date(d);
            scatterDay.setDate(Math.floor(Math.random() * 28) + 1);
            addExpensesForDate(scatterDay, 1);
        }
    }

    // 3. Annual View: Ensure Previous Year has data (and 2 years ago for good measure)
    console.log("Generating Annual Data...");
    const years = [today.getFullYear(), today.getFullYear() - 1];
    years.forEach(year => {
        for (let i = 0; i < 50; i++) {
            const month = Math.floor(Math.random() * 12);
            const day = Math.floor(Math.random() * 28) + 1;
            const d = new Date(year, month, day);
            addExpensesForDate(d, 1);
        }
    });

    const outputPath = path.join(__dirname, '../data/expenses.json');
    // Ensure dir exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(expenses, null, 2));
    console.log(`Generated ${expenses.length} expenses to ${outputPath}`);
};

generateData();
