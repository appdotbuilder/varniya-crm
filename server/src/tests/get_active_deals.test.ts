
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, ordersTable } from '../db/schema';
import { type CreateLeadInput, type CreateOrderInput } from '../schema';
import { getActiveDeals } from '../handlers/get_active_deals';

describe('getActiveDeals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active deals (non-cancelled orders)', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    // Create test lead
    const lead = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '+1234567890',
        email: 'lead@example.com',
        lead_source: 'WATI',
        lead_medium: 'WhatsApp',
        request_type: 'Product enquiry',
        assigned_to: user[0].id
      })
      .returning()
      .execute();

    // Create active order
    const activeOrder = await db.insert(ordersTable)
      .values({
        lead_id: lead[0].id,
        order_number: 'ORD-001',
        product_details: '{"product": "Custom Design", "quantity": 1}',
        total_amount: '1500.00',
        advance_amount: '500.00',
        balance_amount: '1000.00',
        order_status: 'Confirmed',
        payment_status: 'Partial'
      })
      .returning()
      .execute();

    // Create cancelled order (should not appear in results)
    await db.insert(ordersTable)
      .values({
        lead_id: lead[0].id,
        order_number: 'ORD-002',
        product_details: '{"product": "Another Design", "quantity": 2}',
        total_amount: '2000.00',
        order_status: 'Cancelled',
        payment_status: 'Pending'
      })
      .execute();

    const results = await getActiveDeals();

    // Should return only the active order
    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(activeOrder[0].id);
    expect(results[0].order_number).toEqual('ORD-001');
    expect(results[0].order_status).toEqual('Confirmed');
    expect(results[0].total_amount).toEqual(1500.00);
    expect(results[0].advance_amount).toEqual(500.00);
    expect(results[0].balance_amount).toEqual(1000.00);
    expect(typeof results[0].total_amount).toBe('number');
    expect(typeof results[0].advance_amount).toBe('number');
    expect(typeof results[0].balance_amount).toBe('number');
  });

  it('should return multiple active deals with different statuses', async () => {
    // Create test user and lead
    const user = await db.insert(usersTable)
      .values({
        name: 'Sales Person',
        email: 'sales@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    const lead = await db.insert(leadsTable)
      .values({
        name: 'Customer',
        phone: '+9876543210',
        email: 'customer@example.com',
        lead_source: 'Google',
        lead_medium: 'Website',
        request_type: 'Product enquiry',
        assigned_to: user[0].id
      })
      .returning()
      .execute();

    // Create orders with different active statuses
    await db.insert(ordersTable)
      .values([
        {
          lead_id: lead[0].id,
          order_number: 'ORD-100',
          product_details: '{"item": "Design A"}',
          total_amount: '800.00',
          order_status: 'Pending',
          payment_status: 'Pending'
        },
        {
          lead_id: lead[0].id,
          order_number: 'ORD-101',
          product_details: '{"item": "Design B"}',
          total_amount: '1200.00',
          order_status: 'In Production',
          payment_status: 'Paid'
        },
        {
          lead_id: lead[0].id,
          order_number: 'ORD-102',
          product_details: '{"item": "Design C"}',
          total_amount: '900.00',
          order_status: 'Delivered',
          payment_status: 'Paid'
        }
      ])
      .execute();

    const results = await getActiveDeals();

    // Should return all active orders
    expect(results).toHaveLength(3);
    expect(results.map(r => r.order_status)).toEqual(
      expect.arrayContaining(['Pending', 'In Production', 'Delivered'])
    );
    
    // Verify numeric conversions
    results.forEach(order => {
      expect(typeof order.total_amount).toBe('number');
      expect(order.total_amount).toBeGreaterThan(0);
    });
  });

  it('should return empty array when no active deals exist', async () => {
    // Create user and lead but no orders
    const user = await db.insert(usersTable)
      .values({
        name: 'Empty Sales',
        email: 'empty@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    await db.insert(leadsTable)
      .values({
        name: 'Lead No Orders',
        lead_source: 'Direct/Unknown',
        lead_medium: 'Direct',
        request_type: 'Other'
      })
      .execute();

    const results = await getActiveDeals();

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle orders with null advance and balance amounts', async () => {
    // Create user and lead
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    const lead = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        lead_source: 'SEO',
        lead_medium: 'Website',
        request_type: 'Product enquiry'
      })
      .returning()
      .execute();

    // Create order with null advance/balance amounts
    await db.insert(ordersTable)
      .values({
        lead_id: lead[0].id,
        order_number: 'ORD-NULL',
        product_details: '{"product": "Simple Design"}',
        total_amount: '600.00',
        advance_amount: null,
        balance_amount: null,
        order_status: 'Ready for Delivery',
        payment_status: 'Paid'
      })
      .execute();

    const results = await getActiveDeals();

    expect(results).toHaveLength(1);
    expect(results[0].total_amount).toEqual(600.00);
    expect(results[0].advance_amount).toBeNull();
    expect(results[0].balance_amount).toBeNull();
    expect(typeof results[0].total_amount).toBe('number');
  });
});
