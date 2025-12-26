import { addEventListener } from '@react-native-community/netinfo';
import { db } from '../db/client';
import { expenses } from '../db/schema';
import { supabase } from '../lib/supabase';
import { eq, gt } from 'drizzle-orm';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_PULL_KEY = 'last_pull_timestamp';

export const SyncService = {
    async init() {
        // Listen for network changes
        addEventListener((state) => {
            if (state.isConnected) {
                this.sync();
            }
        });
    },

    async sync() {
        // Starting sync...
        try {
            await this.pushChanges();
            await this.pullChanges();
            // Sync complete
        } catch (e: any) {
            console.error('Sync failed:', e);
        }
    },


    async pushChanges() {
        // 1. Get pending changes
        const pendingExpenses = await db.query.expenses.findMany({
            where: eq(expenses.syncStatus, 'PENDING'),
        });

        if (pendingExpenses.length === 0) return;

        // Pushing changes to Supabase
        const payloads = pendingExpenses.map((exp: any) => ({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            date: exp.date.toISOString(), // Ensure ISO string
            category: exp.category,
            user_id: exp.userId,
            created_at: exp.createdAt.toISOString(),
            updated_at: exp.updatedAt.toISOString(),
            deleted: exp.deleted === true || exp.deleted === 1,
            type: exp.type || 'expense'
        }));

        const { error: pushError } = await supabase.from('expenses').upsert(payloads);

        if (!pushError) {
            await db.update(expenses)
                .set({ syncStatus: 'SYNCED' })
                .where(eq(expenses.syncStatus, 'PENDING'));
        } else {
            console.error('Failed to push expenses:', pushError);
        }
    },

    async pullChanges() {
        const lastPull = await AsyncStorage.getItem(LAST_PULL_KEY);
        const lastPullTime = lastPull ? new Date(parseInt(lastPull)).toISOString() : new Date(0).toISOString();

        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .gt('updated_at', lastPullTime);

        if (error || !data) {
            console.error('Failed to pull changes:', error);
            return;
        }

        if (data.length > 0) {
            // Pulling changes from Supabase
            const items = data as any[];
            for (const remoteExp of items) {
                await db.insert(expenses)
                    .values({
                        id: remoteExp.id,
                        description: remoteExp.description,
                        amount: remoteExp.amount,
                        category: remoteExp.category,
                        date: new Date(remoteExp.date),
                        userId: remoteExp.user_id,
                        createdAt: new Date(remoteExp.created_at),
                        updatedAt: new Date(remoteExp.updated_at),
                        syncStatus: 'SYNCED',
                        deleted: remoteExp.deleted === true || remoteExp.deleted === 1,
                        type: remoteExp.type || 'expense'
                    } as any)
                    .onConflictDoUpdate({
                        target: expenses.id,
                        set: {
                            description: remoteExp.description,
                            amount: remoteExp.amount,
                            category: remoteExp.category,
                            date: new Date(remoteExp.date),
                            userId: remoteExp.user_id,
                            createdAt: new Date(remoteExp.created_at),
                            updatedAt: new Date(remoteExp.updated_at),
                            syncStatus: 'SYNCED',
                            deleted: remoteExp.deleted === true || remoteExp.deleted === 1,
                            type: remoteExp.type || 'expense'
                        } as any
                    });
            }
        }

        await AsyncStorage.setItem(LAST_PULL_KEY, Date.now().toString());
    }
};

