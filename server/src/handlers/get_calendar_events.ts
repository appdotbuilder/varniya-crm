
import { db } from '../db';
import { calendarEventsTable } from '../db/schema';
import { type CalendarEvent } from '../schema';
import { eq, and, gte, lte, type SQL } from 'drizzle-orm';

export interface GetCalendarEventsFilters {
  start_date?: Date;
  end_date?: Date;
  event_type?: 'Follow Up' | 'Meeting' | 'Call' | 'Delivery' | 'Other';
  assigned_to?: number;
}

export const getCalendarEvents = async (filters?: GetCalendarEventsFilters): Promise<CalendarEvent[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Filter by date range
    if (filters?.start_date) {
      conditions.push(gte(calendarEventsTable.start_time, filters.start_date));
    }

    if (filters?.end_date) {
      conditions.push(lte(calendarEventsTable.end_time, filters.end_date));
    }

    // Filter by event type
    if (filters?.event_type) {
      conditions.push(eq(calendarEventsTable.event_type, filters.event_type));
    }

    // Filter by assigned user
    if (filters?.assigned_to) {
      conditions.push(eq(calendarEventsTable.assigned_to, filters.assigned_to));
    }

    // Build final query
    const query = conditions.length > 0
      ? db.select()
          .from(calendarEventsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(calendarEventsTable.start_time)
      : db.select()
          .from(calendarEventsTable)
          .orderBy(calendarEventsTable.start_time);

    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    throw error;
  }
};
