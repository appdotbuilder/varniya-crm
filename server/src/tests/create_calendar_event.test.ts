
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calendarEventsTable, usersTable, leadsTable } from '../db/schema';
import { type CreateCalendarEventInput } from '../schema';
import { createCalendarEvent } from '../handlers/create_calendar_event';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'Sales' as const,
  phone: '+1234567890'
};

// Test lead data
const testLead = {
  name: 'Test Lead',
  phone: '+9876543210',
  email: 'lead@example.com',
  lead_source: 'Google' as const,
  lead_medium: 'Email' as const,
  request_type: 'Product enquiry' as const
};

// Simple test input
const testInput: CreateCalendarEventInput = {
  title: 'Follow up call',
  description: 'Initial follow up with the lead',
  start_time: new Date('2024-01-15T10:00:00Z'),
  end_time: new Date('2024-01-15T10:30:00Z'),
  event_type: 'Follow Up',
  lead_id: null,
  order_id: null,
  assigned_to: 1
};

describe('createCalendarEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a calendar event', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createCalendarEvent({
      ...testInput,
      assigned_to: userId
    }, userId);

    // Basic field validation
    expect(result.title).toEqual('Follow up call');
    expect(result.description).toEqual('Initial follow up with the lead');
    expect(result.start_time).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.event_type).toEqual('Follow Up');
    expect(result.lead_id).toBeNull();
    expect(result.order_id).toBeNull();
    expect(result.assigned_to).toEqual(userId);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save calendar event to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createCalendarEvent({
      ...testInput,
      assigned_to: userId
    }, userId);

    // Query using proper drizzle syntax
    const events = await db.select()
      .from(calendarEventsTable)
      .where(eq(calendarEventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Follow up call');
    expect(events[0].description).toEqual('Initial follow up with the lead');
    expect(events[0].event_type).toEqual('Follow Up');
    expect(events[0].assigned_to).toEqual(userId);
    expect(events[0].created_by).toEqual(userId);
    expect(events[0].created_at).toBeInstanceOf(Date);
    expect(events[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create event linked to a lead', async () => {
    // Create prerequisite user and lead
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const leadResult = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_to: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    const result = await createCalendarEvent({
      ...testInput,
      lead_id: leadId,
      assigned_to: userId
    }, userId);

    expect(result.lead_id).toEqual(leadId);
    expect(result.order_id).toBeNull();

    // Verify in database
    const events = await db.select()
      .from(calendarEventsTable)
      .where(eq(calendarEventsTable.id, result.id))
      .execute();

    expect(events[0].lead_id).toEqual(leadId);
    expect(events[0].order_id).toBeNull();
  });

  it('should create event with different event types', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const meetingInput: CreateCalendarEventInput = {
      title: 'Client meeting',
      description: 'Discuss project requirements',
      start_time: new Date('2024-01-20T14:00:00Z'),
      end_time: new Date('2024-01-20T15:00:00Z'),
      event_type: 'Meeting',
      assigned_to: userId
    };

    const result = await createCalendarEvent(meetingInput, userId);

    expect(result.title).toEqual('Client meeting');
    expect(result.event_type).toEqual('Meeting');
    expect(result.start_time).toEqual(new Date('2024-01-20T14:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-20T15:00:00Z'));
  });

  it('should handle null description', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const inputWithoutDescription: CreateCalendarEventInput = {
      title: 'Quick call',
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T09:15:00Z'),
      event_type: 'Call',
      assigned_to: userId
    };

    const result = await createCalendarEvent(inputWithoutDescription, userId);

    expect(result.title).toEqual('Quick call');
    expect(result.description).toBeNull();
    expect(result.event_type).toEqual('Call');
  });
});
