import React, { createContext, useContext, useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";
import { db, migrateDb } from "../db/client";
import { expenses as expensesSchema } from "../db/schema";
import { SyncService } from "../services/SyncService";
import { eq, desc, and } from "drizzle-orm";
import { Platform } from 'react-native';
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO string used by UI
    category: string;
    type: 'expense' | 'income';
}

interface ExpenseContextType {
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, "id">) => void;
    deleteExpense: (id: string) => void;
    updateExpense: (id: string, updates: Partial<Expense>) => void;
    isLoading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { categories } = useSettings();
    const { user } = useAuth();

    const userId = user?.id || "offline_user";


    useEffect(() => {
        const init = async () => {
            // STEP 1: Handle Web-specific initialization (Direct cloud connection)
            if (Platform.OS === 'web') {
                await loadExpenses();
                return;
            }

            try {
                // STEP 2: Handle Native initialization (Local DB migration & Sync Service)
                await migrateDb(); // Ensure table exists
                SyncService.init();
                await loadExpenses();
            } catch (e: any) {
                console.error("Failed to initialize database", e);
            }
        };
        init();
    }, [userId]);

    const loadExpenses = async () => {
        try {
            // STEP 3: Load and format data based on current context
            setIsLoading(true);

            if (Platform.OS === 'web') {
                const { data, error } = await supabase
                    .from('expenses')
                    .select('*')
                    .order('date', { ascending: false });

                if (error) throw error;

                const mappedExpenses = (data || []).map((e: any) => {
                    // Smart Migration: Infer type from category if missing or default
                    let resolvedType = e.type;
                    if (!resolvedType || resolvedType === 'expense') {
                        const cat = categories.find(c => c.name === e.category);
                        if (cat && cat.type === 'income') {
                            resolvedType = 'income';
                        } else {
                            resolvedType = 'expense';
                        }
                    }

                    return {
                        id: e.id,
                        description: e.description,
                        amount: e.amount,
                        date: e.date,
                        category: e.category,
                        type: resolvedType as 'expense' | 'income',
                    };
                });
                setExpenses(mappedExpenses);
                return;
            }

            // Native/Offline Logic
            const result = await db.query.expenses.findMany({
                where: and(
                    eq(expensesSchema.deleted, false),
                    eq(expensesSchema.userId, userId)
                ),
                orderBy: [desc(expensesSchema.date)],
            });

            // Map DB result (Date objects) to UI format (ISO strings)
            const mappedExpenses: Expense[] = result.map((e: any) => {
                // Smart Migration: Infer type from category if missing or default
                let resolvedType = e.type;
                if (!resolvedType || resolvedType === 'expense') {
                    const cat = categories.find(c => c.name === e.category);
                    if (cat && cat.type === 'income') {
                        resolvedType = 'income';
                    } else {
                        resolvedType = 'expense';
                    }
                }

                return {
                    id: e.id,
                    description: e.description,
                    amount: e.amount,
                    date: e.date.toISOString(),
                    category: e.category,
                    type: resolvedType as 'expense' | 'income',
                };
            });

            setExpenses(mappedExpenses);
        } catch (e: any) {
            console.error("Failed to load expenses", e);
        } finally {
            setIsLoading(false);
        }
    };

    const generateId = () => {
        return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const addExpense = async (data: Omit<Expense, "id">) => {
        try {
            const newId = generateId();
            const now = new Date();
            const expenseType = data.type || 'expense';

            if (Platform.OS === 'web') {
                const payload = {
                    id: newId,
                    description: data.description,
                    amount: data.amount,
                    date: new Date(data.date).toISOString(),
                    category: data.category,
                    type: expenseType,
                    user_id: userId,
                    created_at: now.toISOString(),
                    updated_at: now.toISOString(),
                };
                const { error } = await supabase.from('expenses').insert(payload);
                if (error) console.error("Supabase insert error:", error);

                loadExpenses(); // Refresh list
                return;
            }

            await db.insert(expensesSchema).values({
                id: newId,
                description: data.description,
                amount: data.amount,
                date: new Date(data.date), // Convert string to Date for SQLite
                category: data.category,
                type: expenseType,
                userId: userId,
                createdAt: now,
                updatedAt: now,
                syncStatus: 'PENDING', // Mark for sync
                deleted: false,
            });

            // Reload to update UI (Fast enough for local DB)
            loadExpenses();

            // Trigger Sync immediately (in background)
            SyncService.pushChanges();
        } catch (e: any) {
            console.error("Failed to add expense", e);
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            if (Platform.OS === 'web') {
                const { error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('id', id);
                if (error) console.error("Supabase delete error:", error);
                loadExpenses();
                return;
            }

            // Soft delete
            await db.update(expensesSchema)
                .set({
                    deleted: true,
                    syncStatus: 'PENDING',
                    updatedAt: new Date()
                })
                .where(eq(expensesSchema.id, id));

            loadExpenses();
            SyncService.pushChanges();
        } catch (e: any) {
            console.error("Failed to delete expense", e);
        }
    };

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            if (Platform.OS === 'web') {
                const updatePayload: any = { updated_at: new Date().toISOString() };
                if (updates.description) updatePayload.description = updates.description;
                if (updates.amount) updatePayload.amount = updates.amount;
                if (updates.category) updatePayload.category = updates.category;
                if (updates.type) updatePayload.type = updates.type;
                if (updates.date) updatePayload.date = new Date(updates.date).toISOString();

                const { error } = await supabase
                    .from('expenses')
                    .update(updatePayload)
                    .eq('id', id);

                if (error) console.error("Supabase update error:", error);
                loadExpenses();
                return;
            }

            const updateData: any = {
                syncStatus: 'PENDING',
                updatedAt: new Date()
            };

            if (updates.description) updateData.description = updates.description;
            if (updates.amount) updateData.amount = updates.amount;
            if (updates.category) updateData.category = updates.category;
            if (updates.type) updateData.type = updates.type;
            if (updates.date) updateData.date = new Date(updates.date);

            await db.update(expensesSchema)
                .set(updateData)
                .where(eq(expensesSchema.id, id));

            loadExpenses();
            SyncService.pushChanges();
        } catch (e: any) {
            console.error("Failed to update expense", e);
        }
    };

    return (
        <ExpenseContext.Provider value={{ expenses, addExpense, deleteExpense, updateExpense, isLoading }}>
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
