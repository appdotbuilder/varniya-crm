
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calendarEventsTable, usersTable } from '../db/schema';
import { getCalendarEvents, type GetCalendarEventsFilters } from '../handlers/get_calendar_events';

describe('getCalendarEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestEvent = async (assignedTo: number, overrides: Partial<any> = {}) => {
    const defaultEvent = {
      title: 'Test Event',
      start_time: new Date('2024-01-15T10:00:00Z'),
      end_time: new Date('2024-01-15T11:00:00Z'),
      event_type: 'Meeting' as const,
      assigned_to: assignedTo,
      created_by: assignedTo,
      ...overrides
    };

    const result = await db.insert(calendarEventsTable)
      .values(defaultEvent)
      .returning()
      .execute();
    return result[0];
  };

  it('should fetch all calendar events when no filters applied', async () => {
    const user = await createTestUser();
    await createTestEvent(user.id, { title: 'Event 1' });
    await createTestEvent(user.id, { title: 'Event 2', event_type: 'Call' });

    const events = await getCalendarEvents();

    expect(events).toHaveLength(2);
    expect(events[0].title).toEqual('Event 1');
    expect(events[1].title).toEqual('Event 2');
  });

  it('should filter events by date range', async () => {
    const user = await createTestUser();
    
    // Event within range
    await createTestEvent(user.id, {
      title: 'Event in Range',
      start_time: new Date('2024-01-15T10:00:00Z'),
      end_time: new Date('2024-01-15T11:00:00Z')
    });

    // Event outside range
    await createTestEvent(user.id, {
      title: 'Event Outside Range',
      start_time: new Date('2024-01-20T10:00:00Z'),
      end_time: new Date('2024-01-20T11:00:00Z')
    });

    const filters: GetCalendarEventsFilters = {
      start_date: new Date('2024-01-10T00:00:00Z'),
      end_date: new Date('2024-01-16T23:59:59Z')
    };

    const events = await getCalendarEvents(filters);

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Event in Range');
  });

  it('should filter events by event type', async () => {
    const user = await createTestUser();
    
    await createTestEvent(user.id, { title: 'Meeting Event', event_type: 'Meeting' });
    await createTestEvent(user.id, { title: 'Call Event', event_type: 'Call' });
    await createTestEvent(user.id, { title: 'Follow Up Event', event_type: 'Follow Up' });

    const filters: GetCalendarEventsFilters = {
      event_type: 'Call'
    };

    const events = await getCalendarEvents(filters);

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Call Event');
    expect(events[0].event_type).toEqual('Call');
  });

  it('should filter events by assigned user', async () => {
    const user1 = await createTestUser();
    const user2 = await db.insert(usersTable)
      .values({
        name: 'User 2',
        email: 'user2@example.com',
        role: 'Sales Agent'
      })
      .returning()
      .execute()
      .then(result => result[0]);

    await createTestEvent(user1.id, { title: 'User 1 Event' });
    await createTestEvent(user2.id, { title: 'User 2 Event' });

    const filters: GetCalendarEventsFilters = {
      assigned_to: user1.id
    };

    const events = await getCalendarEvents(filters);

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('User 1 Event');
    expect(events[0].assigned_to).toEqual(user1.id);
  });

  it('should apply multiple filters correctly', async () => {
    const user1 = await createTestUser();
    const user2 = await db.insert(usersTable)
      .values({
        name: 'User 2',
        email: 'user2@example.com',
        role: 'Sales Agent'
      })
      .returning()
      .execute()
      .then(result => result[0]);

    // Event matching all filters
    await createTestEvent(user1.id, {
      title: 'Matching Event',
      event_type: 'Meeting',
      start_time: new Date('2024-01-15T10:00:00Z'),
      end_time: new Date('2024-01-15T11:00:00Z')
    });

    // Event with wrong user
    await createTestEvent(user2.id, {
      title: 'Wrong User Event',
      event_type: 'Meeting',
      start_time: new Date('2024-01-15T12:00:00Z'),
      end_time: new Date('2024-01-15T13:00:00Z')
    });

    // Event with wrong type
    await createTestEvent(user1.id, {
      title: 'Wrong Type Event',
      event_type: 'Call',
      start_time: new Date('2024-01-15T14:00:00Z'),
      end_time: new Date('2024-01-15T15:00:00Z')
    });

    const filters: GetCalendarEventsFilters = {
      assigned_to: user1.id,
      event_type: 'Meeting',
      start_date: new Date('2024-01-14T00:00:00Z'),
      end_date: new Date('2024-01-16T23:59:59Z')
    };

    const events = await getCalendarEvents(filters);

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Matching Event');
  });

  it('should return events ordered by start time', async () => {
    const user = await createTestUser();
    
    // Create events in random order
    await createTestEvent(user.id, {
      title: 'Third Event',
      start_time: new Date('2024-01-15T15:00:00Z'),
      end_time: new Date('2024-01-15T16:00:00Z')
    });

    await createTestEvent(user.id, {
      title: 'First Event',
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T10:00:00Z')
    });

    await createTestEvent(user.id, {
      title: 'Second Event',
      start_time: new Date('2024-01-15T12:00:00Z'),
      end_time: new Date('2024-01-15T13:00:00Z')
    });

    const events = await getCalendarEvents();

    expect(events).toHaveLength(3);
    expect(events[0].title).toEqual('First Event');
    expect(events[1].title).toEqual('Second Event');
    expect(events[2].title).toEqual('Third Event');
  });

  it('should return empty array when no events match filters', async () => {
    const user = await createTestUser();
    await createTestEvent(user.id, { event_type: 'Meeting' });

    const filters: GetCalendarEventsFilters = {
      event_type: 'Delivery'
    };

    const events = await getCalendarEvents(filters);

    expect(events).toHaveLength(0);
  });

  it('should handle events with optional fields', async () => {
    const user = await createTestUser();
    
    await createTestEvent(user.id, {
      title: 'Event with Optional Fields',
      description: 'Test description',
      lead_id: null,
      order_id: null
    });

    const events = await getCalendarEvents();

    expect(events).toHaveLength(1);
    expect(events[0].description).toEqual('Test description');
    expect(events[0].lead_id).toBeNull();
    expect(events[0].order_id).toBeNull();
  });
});
