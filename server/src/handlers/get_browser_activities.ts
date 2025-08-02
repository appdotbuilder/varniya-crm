
import { db } from '../db';
import { browserActivitiesTable } from '../db/schema';
import { type BrowserActivity } from '../schema';
import { desc } from 'drizzle-orm';

export const getBrowserActivities = async (): Promise<BrowserActivity[]> => {
  try {
    const results = await db.select()
      .from(browserActivitiesTable)
      .orderBy(desc(browserActivitiesTable.last_activity_at))
      .execute();

    return results.map(activity => ({
      ...activity,
      // Convert timestamp fields to Date objects
      first_activity_at: new Date(activity.first_activity_at),
      last_activity_at: new Date(activity.last_activity_at),
      created_at: new Date(activity.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch browser activities:', error);
    throw error;
  }
};
