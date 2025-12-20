import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "./SettingsContext";

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO string
    category: string; // Name of the category
}

interface ExpenseContextType {
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, "id">) => void;
    deleteExpense: (id: string) => void;
    updateExpense: (id: string, updates: Partial<Expense>) => void;
    generateSampleData: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = "@daily_xpense_data_v1"; // Bump version to force refresh

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { categories } = useSettings();

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            if (jsonValue != null) {
                setExpenses(JSON.parse(jsonValue));
            } else {
                generateSampleData();
            }
        } catch (e) {
            console.error("Failed to load expenses", e);
        }
    };

    const saveExpenses = async (newExpenses: Expense[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
        } catch (e) {
            console.error("Failed to save expenses", e);
        }
    };

    const generateId = () => {
        return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const addExpense = (data: Omit<Expense, "id">) => {
        const newExpense = { ...data, id: generateId() };
        const updated = [newExpense, ...expenses];
        setExpenses(updated);
        saveExpenses(updated);
    };

    const deleteExpense = (id: string) => {
        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated);
        saveExpenses(updated);
    };

    const updateExpense = (id: string, updates: Partial<Expense>) => {
        const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
        setExpenses(updated);
        saveExpenses(updated);
    };

    const generateSampleData = () => {
        const today = new Date();
        const sampleExpenses: Expense[] = [];
        const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

        // Fallback names if categories are somehow empty
        const fallbackNames = ["Food", "Transport", "Shopping", "Entertainment", "Bills"];

        for (let i = 0; i < 60; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString();
            const count = Math.floor(Math.random() * 5); // 0-4 expenses per day

            for (let j = 0; j < count; j++) {
                let catName = "General";
                if (categories && categories.length > 0) {
                    const randomCat = categories[Math.floor(Math.random() * categories.length)];
                    catName = randomCat.name;
                } else {
                    catName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
                }

                sampleExpenses.push({
                    id: genId(`auto_${i}_${j}`),
                    description: `Sample ${catName}`,
                    amount: parseFloat((Math.random() * 50 + 10).toFixed(2)),
                    date: dateStr,
                    category: catName
                });
            }
        }

        setExpenses(sampleExpenses);
        saveExpenses(sampleExpenses);
    };

    return (
        <ExpenseContext.Provider value={{ expenses, addExpense, deleteExpense, updateExpense, generateSampleData }}>
            {children}
        </ExpenseContext.Provider>
    );
}

export function useExpenses() {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error("useExpenses must be used within an ExpenseProvider");
    }
    return context;
}
