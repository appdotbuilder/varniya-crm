
import { db } from '../db';
import { ordersTable, leadsTable } from '../db/schema';
import { type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOrders(): Promise<Order[]> {
  try {
    // Join orders with leads to get complete order information
    const results = await db.select()
      .from(ordersTable)
      .innerJoin(leadsTable, eq(ordersTable.lead_id, leadsTable.id))
      .execute();

    // Transform results and handle numeric conversions
    return results.map(result => {
      const order = result.orders;
      return {
        ...order,
        total_amount: parseFloat(order.total_amount),
        advance_amount: order.advance_amount ? parseFloat(order.advance_amount) : null,
        balance_amount: order.balance_amount ? parseFloat(order.balance_amount) : null
      };
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}
