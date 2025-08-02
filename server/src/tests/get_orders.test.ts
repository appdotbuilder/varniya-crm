
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, leadsTable, usersTable } from '../db/schema';
import { type CreateLeadInput, type CreateOrderInput } from '../schema';
import { getOrders } from '../handlers/get_orders';

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getOrders();
    expect(result).toEqual([]);
  });

  it('should fetch all orders with proper numeric conversions', async () => {
    // Create prerequisite user
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    // Create prerequisite lead
    const [lead] = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '+1234567890',
        email: 'lead@example.com',
        lead_source: 'Google',
        lead_medium: 'Website',
        request_type: 'Product enquiry',
        assigned_to: user.id
      })
      .returning()
      .execute();

    // Create test order
    const [createdOrder] = await db.insert(ordersTable)
      .values({
        lead_id: lead.id,
        order_number: 'ORD-001',
        product_details: '{"items": [{"name": "Test Product", "quantity": 1}]}',
        total_amount: '1999.99',
        advance_amount: '500.00',
        balance_amount: '1499.99',
        payment_status: 'Partial',
        order_status: 'Confirmed'
      })
      .returning()
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(1);
    
    const order = result[0];
    expect(order.id).toEqual(createdOrder.id);
    expect(order.order_number).toEqual('ORD-001');
    expect(order.lead_id).toEqual(lead.id);
    expect(order.product_details).toEqual('{"items": [{"name": "Test Product", "quantity": 1}]}');
    
    // Verify numeric conversions
    expect(typeof order.total_amount).toBe('number');
    expect(order.total_amount).toEqual(1999.99);
    expect(typeof order.advance_amount).toBe('number');
    expect(order.advance_amount).toEqual(500.00);
    expect(typeof order.balance_amount).toBe('number');
    expect(order.balance_amount).toEqual(1499.99);
    
    expect(order.payment_status).toEqual('Partial');
    expect(order.order_status).toEqual('Confirmed');
    expect(order.sla_breach).toEqual(false);
    expect(order.created_at).toBeInstanceOf(Date);
    expect(order.updated_at).toBeInstanceOf(Date);
  });

  it('should handle orders with null numeric fields', async () => {
    // Create prerequisite user and lead
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    const [lead] = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '+1234567890',
        email: 'lead@example.com',
        lead_source: 'Google',
        lead_medium: 'Website',
        request_type: 'Product enquiry',
        assigned_to: user.id
      })
      .returning()
      .execute();

    // Create order with null advance and balance amounts
    await db.insert(ordersTable)
      .values({
        lead_id: lead.id,
        order_number: 'ORD-002',
        product_details: '{"items": [{"name": "Basic Product", "quantity": 1}]}',
        total_amount: '999.99',
        advance_amount: null,
        balance_amount: null,
        payment_status: 'Pending',
        order_status: 'Pending'
      })
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(1);
    
    const order = result[0];
    expect(order.total_amount).toEqual(999.99);
    expect(order.advance_amount).toBeNull();
    expect(order.balance_amount).toBeNull();
  });

  it('should fetch multiple orders correctly', async () => {
    // Create prerequisite user
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    // Create multiple leads
    const [lead1] = await db.insert(leadsTable)
      .values({
        name: 'Lead One',
        phone: '+1111111111',
        email: 'lead1@example.com',
        lead_source: 'Google',
        lead_medium: 'Website',
        request_type: 'Product enquiry',
        assigned_to: user.id
      })
      .returning()
      .execute();

    const [lead2] = await db.insert(leadsTable)
      .values({
        name: 'Lead Two',
        phone: '+2222222222',
        email: 'lead2@example.com',
        lead_source: 'Meta',
        lead_medium: 'Social Media',
        request_type: 'Request for information',
        assigned_to: user.id
      })
      .returning()
      .execute();

    // Create multiple orders
    await db.insert(ordersTable)
      .values([
        {
          lead_id: lead1.id,
          order_number: 'ORD-003',
          product_details: '{"items": [{"name": "Product A", "quantity": 2}]}',
          total_amount: '2500.00',
          payment_status: 'Paid',
          order_status: 'Delivered'
        },
        {
          lead_id: lead2.id,
          order_number: 'ORD-004',
          product_details: '{"items": [{"name": "Product B", "quantity": 1}]}',
          total_amount: '1200.50',
          payment_status: 'Pending',
          order_status: 'In Production'
        }
      ])
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(2);
    
    // Verify both orders are returned with correct data
    const orderNumbers = result.map(order => order.order_number);
    expect(orderNumbers).toContain('ORD-003');
    expect(orderNumbers).toContain('ORD-004');
    
    // Verify numeric conversions for all orders
    result.forEach(order => {
      expect(typeof order.total_amount).toBe('number');
      expect(order.total_amount).toBeGreaterThan(0);
    });
  });
});
