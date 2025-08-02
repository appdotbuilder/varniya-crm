
import { db } from '../db';
import { ordersTable, leadsTable } from '../db/schema';
import { type Order } from '../schema';
import { ne, eq } from 'drizzle-orm';

export async function getActiveDeals(): Promise<Order[]> {
  try {
    // Query orders that are not cancelled and include lead information
    const results = await db.select()
      .from(ordersTable)
      .innerJoin(leadsTable, eq(ordersTable.lead_id, leadsTable.id))
      .where(ne(ordersTable.order_status, 'Cancelled'))
      .execute();

    // Convert numeric fields and return order data with lead information
    return results.map(result => ({
      ...result.orders,
      total_amount: parseFloat(result.orders.total_amount),
      advance_amount: result.orders.advance_amount ? parseFloat(result.orders.advance_amount) : null,
      balance_amount: result.orders.balance_amount ? parseFloat(result.orders.balance_amount) : null
    }));
  } catch (error) {
    console.error('Failed to fetch active deals:', error);
    throw error;
  }
}
