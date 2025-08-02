
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export interface GetUsersFilters {
  role?: string;
  is_active?: boolean;
}

export async function getUsers(filters: GetUsersFilters = {}): Promise<User[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    if (filters.role) {
      conditions.push(eq(usersTable.role, filters.role as any));
    }

    if (filters.is_active !== undefined) {
      conditions.push(eq(usersTable.is_active, filters.is_active));
    }

    const baseQuery = db.select().from(usersTable);

    const results = conditions.length > 0 
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}
