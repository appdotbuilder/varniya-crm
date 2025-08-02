
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { browserActivitiesTable } from '../db/schema';
import { getBrowserActivities } from '../handlers/get_browser_activities';

describe('getBrowserActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activities exist', async () => {
    const result = await getBrowserActivities();
    expect(result).toEqual([]);
  });

  it('should fetch browser activities', async () => {
    // Create test activity
    await db.insert(browserActivitiesTable)
      .values({
        session_id: 'session_123',
        user_id: 'user_456',
        phone: '+1234567890',
        email: 'test@example.com',
        activity_type: 'Product View',
        product_data: '{"product_id": 1, "name": "Test Product"}',
        activity_count: 3,
        intent_score: 75
      })
      .execute();

    const result = await getBrowserActivities();

    expect(result).toHaveLength(1);
    expect(result[0].session_id).toEqual('session_123');
    expect(result[0].user_id).toEqual('user_456');
    expect(result[0].phone).toEqual('+1234567890');
    expect(result[0].email).toEqual('test@example.com');
    expect(result[0].activity_type).toEqual('Product View');
    expect(result[0].product_data).toEqual('{"product_id": 1, "name": "Test Product"}');
    expect(result[0].activity_count).toEqual(3);
    expect(result[0].intent_score).toEqual(75);
    expect(result[0].id).toBeDefined();
    expect(result[0].first_activity_at).toBeInstanceOf(Date);
    expect(result[0].last_activity_at).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple activities ordered by last_activity_at descending', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Create activities with different timestamps
    await db.insert(browserActivitiesTable)
      .values([
        {
          session_id: 'session_1',
          activity_type: 'Product View',
          first_activity_at: twoHoursAgo,
          last_activity_at: twoHoursAgo
        },
        {
          session_id: 'session_2', 
          activity_type: 'Add to Cart',
          first_activity_at: oneHourAgo,
          last_activity_at: oneHourAgo
        },
        {
          session_id: 'session_3',
          activity_type: 'Multiple website visits',
          first_activity_at: now,
          last_activity_at: now
        }
      ])
      .execute();

    const result = await getBrowserActivities();

    expect(result).toHaveLength(3);
    // Should be ordered by last_activity_at descending (most recent first)
    expect(result[0].session_id).toEqual('session_3');
    expect(result[1].session_id).toEqual('session_2');
    expect(result[2].session_id).toEqual('session_1');
  });

  it('should handle activities with null optional fields', async () => {
    await db.insert(browserActivitiesTable)
      .values({
        session_id: 'anonymous_session',
        user_id: null,
        phone: null,
        email: null,
        activity_type: 'Browsed multiple Products',
        product_data: null,
        activity_count: 1,
        intent_score: 25
      })
      .execute();

    const result = await getBrowserActivities();

    expect(result).toHaveLength(1);
    expect(result[0].session_id).toEqual('anonymous_session');
    expect(result[0].user_id).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].activity_type).toEqual('Browsed multiple Products');
    expect(result[0].product_data).toBeNull();
    expect(result[0].activity_count).toEqual(1);
    expect(result[0].intent_score).toEqual(25);
  });

  it('should handle different activity types', async () => {
    const activityTypes = ['Add to Cart', 'Browsed multiple Products', 'Multiple website visits', 'Product View'] as const;

    // Create one activity for each type
    const insertData = activityTypes.map((type, index) => ({
      session_id: `session_${index}`,
      activity_type: type,
      intent_score: (index + 1) * 20
    }));

    await db.insert(browserActivitiesTable)
      .values(insertData)
      .execute();

    const result = await getBrowserActivities();

    expect(result).toHaveLength(4);
    
    // Verify all activity types are present
    const resultTypes = result.map(r => r.activity_type);
    activityTypes.forEach(type => {
      expect(resultTypes).toContain(type);
    });
  });
});
