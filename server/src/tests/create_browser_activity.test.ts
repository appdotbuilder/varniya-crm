
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { browserActivitiesTable, leadsTable } from '../db/schema';
import { type CreateBrowserActivityInput } from '../schema';
import { createBrowserActivity } from '../handlers/create_browser_activity';
import { eq, and } from 'drizzle-orm';

const testInput: CreateBrowserActivityInput = {
  session_id: 'test-session-123',
  user_id: 'user-456',
  phone: '+1234567890',
  email: 'test@example.com',
  activity_type: 'Product View',
  product_data: '{"product_id": 1, "name": "Test Product"}',
  activity_count: 1,
  intent_score: 1
};

describe('createBrowserActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new browser activity', async () => {
    const result = await createBrowserActivity(testInput);

    expect(result.session_id).toEqual('test-session-123');
    expect(result.user_id).toEqual('user-456');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('test@example.com');
    expect(result.activity_type).toEqual('Product View');
    expect(result.product_data).toEqual('{"product_id": 1, "name": "Test Product"}');
    expect(result.activity_count).toEqual(1);
    expect(result.intent_score).toEqual(1); // Product View = 1 point * 1 count
    expect(result.id).toBeDefined();
    expect(result.first_activity_at).toBeInstanceOf(Date);
    expect(result.last_activity_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save activity to database', async () => {
    const result = await createBrowserActivity(testInput);

    const activities = await db.select()
      .from(browserActivitiesTable)
      .where(eq(browserActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].session_id).toEqual('test-session-123');
    expect(activities[0].activity_type).toEqual('Product View');
    expect(activities[0].intent_score).toEqual(1);
  });

  it('should calculate intent scores correctly for different activity types', async () => {
    const addToCartInput: CreateBrowserActivityInput = {
      session_id: 'test-session-456',
      activity_type: 'Add to Cart',
      activity_count: 2
    };

    const result = await createBrowserActivity(addToCartInput);

    expect(result.intent_score).toEqual(10); // Add to Cart = 5 points * 2 count
  });

  it('should update existing activity for same session and type', async () => {
    // Create initial activity
    await createBrowserActivity(testInput);

    // Create another activity for same session and type
    const secondInput: CreateBrowserActivityInput = {
      session_id: 'test-session-123',
      activity_type: 'Product View',
      activity_count: 2
    };

    const result = await createBrowserActivity(secondInput);

    // Should have updated count and score
    expect(result.activity_count).toEqual(3); // 1 + 2
    expect(result.intent_score).toEqual(3); // Product View = 1 point * 3 total count

    // Should only be one record in database
    const activities = await db.select()
      .from(browserActivitiesTable)
      .where(eq(browserActivitiesTable.session_id, 'test-session-123'))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].activity_count).toEqual(3);
  });

  it('should create separate records for different activity types', async () => {
    // Create Product View activity
    await createBrowserActivity(testInput);

    // Create Add to Cart activity for same session
    const cartInput: CreateBrowserActivityInput = {
      session_id: 'test-session-123',
      activity_type: 'Add to Cart',
      activity_count: 1
    };

    await createBrowserActivity(cartInput);

    // Should have two separate records
    const activities = await db.select()
      .from(browserActivitiesTable)
      .where(eq(browserActivitiesTable.session_id, 'test-session-123'))
      .execute();

    expect(activities).toHaveLength(2);
    
    const activityTypes = activities.map(a => a.activity_type).sort();
    expect(activityTypes).toEqual(['Add to Cart', 'Product View']);
  });

  it('should auto-promote high-intent users to leads', async () => {
    const highIntentInput: CreateBrowserActivityInput = {
      session_id: 'high-intent-session',
      phone: '+9876543210',
      email: 'highintent@example.com',
      activity_type: 'Add to Cart',
      activity_count: 2 // This will give 10 points, above threshold of 8
    };

    await createBrowserActivity(highIntentInput);

    // Check if lead was created
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.phone, '+9876543210'))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].phone).toEqual('+9876543210');
    expect(leads[0].email).toEqual('highintent@example.com');
    expect(leads[0].is_high_intent).toBe(true);
    expect(leads[0].lead_source).toEqual('Organic');
    expect(leads[0].lead_medium).toEqual('Website');
    expect(leads[0].pipeline_stage).toEqual('Raw lead');
    expect(leads[0].urgency_level).toEqual('High');
    expect(leads[0].lead_score).toEqual(10);
    expect(leads[0].notes).toContain('Auto-created from high-intent browser activity');
  });

  it('should not create duplicate leads for existing contacts', async () => {
    // Create initial lead manually
    await db.insert(leadsTable)
      .values({
        phone: '+9876543210',
        email: 'existing@example.com',
        lead_source: 'WATI',
        lead_medium: 'WhatsApp',
        request_type: 'Product enquiry'
      })
      .execute();

    const highIntentInput: CreateBrowserActivityInput = {
      session_id: 'duplicate-test-session',
      phone: '+9876543210',
      email: 'existing@example.com',
      activity_type: 'Add to Cart',
      activity_count: 2
    };

    await createBrowserActivity(highIntentInput);

    // Should still only have one lead
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.phone, '+9876543210'))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].lead_source).toEqual('WATI'); // Original lead should remain unchanged
  });

  it('should handle activities without contact information', async () => {
    const anonymousInput: CreateBrowserActivityInput = {
      session_id: 'anonymous-session',
      activity_type: 'Browsed multiple Products',
      activity_count: 3
    };

    const result = await createBrowserActivity(anonymousInput);

    expect(result.user_id).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.intent_score).toEqual(9); // 3 points * 3 count

    // Should not create any leads
    const leads = await db.select()
      .from(leadsTable)
      .execute();

    expect(leads).toHaveLength(0);
  });

  it('should update contact info when provided in subsequent activities', async () => {
    // Create anonymous activity first
    const anonymousInput: CreateBrowserActivityInput = {
      session_id: 'update-contact-session',
      activity_type: 'Product View',
      activity_count: 1
    };

    await createBrowserActivity(anonymousInput);

    // Add contact info in second activity
    const withContactInput: CreateBrowserActivityInput = {
      session_id: 'update-contact-session',
      phone: '+5555555555',
      email: 'updated@example.com',
      activity_type: 'Product View',
      activity_count: 1
    };

    const result = await createBrowserActivity(withContactInput);

    expect(result.phone).toEqual('+5555555555');
    expect(result.email).toEqual('updated@example.com');
    expect(result.activity_count).toEqual(2);
  });
});
