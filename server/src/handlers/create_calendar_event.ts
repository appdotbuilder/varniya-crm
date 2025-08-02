
import { db } from '../db';
import { calendarEventsTable } from '../db/schema';
import { type CreateCalendarEventInput, type CalendarEvent } from '../schema';

export const createCalendarEvent = async (input: CreateCalendarEventInput, created_by: number): Promise<CalendarEvent> => {
  try {
    // Insert calendar event record
    const result = await db.insert(calendarEventsTable)
      .values({
        title: input.title,
        description: input.description || null,
        start_time: input.start_time,
        end_time: input.end_time,
        event_type: input.event_type,
        lead_id: input.lead_id || null,
        order_id: input.order_id || null,
        assigned_to: input.assigned_to,
        created_by: created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Calendar event creation failed:', error);
    throw error;
  }
};
