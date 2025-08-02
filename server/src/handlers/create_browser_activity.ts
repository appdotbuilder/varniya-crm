
import { db } from '../db';
import { browserActivitiesTable, leadsTable } from '../db/schema';
import { type CreateBrowserActivityInput, type BrowserActivity } from '../schema';
import { eq, and } from 'drizzle-orm';

// Intent score mapping based on activity type
const INTENT_SCORES = {
  'Product View': 1,
  'Multiple website visits': 2,
  'Browsed multiple Products': 3,
  'Add to Cart': 5
} as const;

// High intent threshold for automatic lead promotion
const HIGH_INTENT_THRESHOLD = 8;

export async function createBrowserActivity(input: CreateBrowserActivityInput): Promise<BrowserActivity> {
  try {
    // Calculate intent score based on activity type
    const baseScore = INTENT_SCORES[input.activity_type] || 0;
    const activityCount = input.activity_count || 1;
    const calculatedScore = baseScore * activityCount;

    // Check if there's an existing activity for this session and activity type
    const existingActivity = await db.select()
      .from(browserActivitiesTable)
      .where(
        and(
          eq(browserActivitiesTable.session_id, input.session_id),
          eq(browserActivitiesTable.activity_type, input.activity_type)
        )
      )
      .limit(1)
      .execute();

    let result: BrowserActivity;

    if (existingActivity.length > 0) {
      // Update existing activity - increment count and recalculate score
      const existing = existingActivity[0];
      const newCount = existing.activity_count + activityCount;
      const newScore = INTENT_SCORES[input.activity_type] * newCount;

      const updatedActivity = await db.update(browserActivitiesTable)
        .set({
          activity_count: newCount,
          intent_score: newScore,
          last_activity_at: new Date(),
          // Update contact info if provided
          user_id: input.user_id || existing.user_id,
          phone: input.phone || existing.phone,
          email: input.email || existing.email,
          product_data: input.product_data || existing.product_data
        })
        .where(eq(browserActivitiesTable.id, existing.id))
        .returning()
        .execute();

      result = updatedActivity[0];
    } else {
      // Create new activity record
      const insertResult = await db.insert(browserActivitiesTable)
        .values({
          session_id: input.session_id,
          user_id: input.user_id || null,
          phone: input.phone || null,
          email: input.email || null,
          activity_type: input.activity_type,
          product_data: input.product_data || null,
          activity_count: activityCount,
          intent_score: calculatedScore
        })
        .returning()
        .execute();

      result = insertResult[0];
    }

    // Check if user should be automatically promoted to lead
    await checkForLeadPromotion(result);

    return result;
  } catch (error) {
    console.error('Browser activity creation failed:', error);
    throw error;
  }
}

async function checkForLeadPromotion(activity: BrowserActivity): Promise<void> {
  // Only promote if we have contact information and high intent score
  if (activity.intent_score >= HIGH_INTENT_THRESHOLD && (activity.phone || activity.email)) {
    try {
      // Check if lead already exists for this contact
      const conditions = [];
      
      if (activity.phone) {
        conditions.push(eq(leadsTable.phone, activity.phone));
      }
      
      if (activity.email) {
        conditions.push(eq(leadsTable.email, activity.email));
      }

      if (conditions.length === 0) return;

      const existingLead = await db.select()
        .from(leadsTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(1)
        .execute();

      // Create lead if doesn't exist
      if (existingLead.length === 0) {
        await db.insert(leadsTable)
          .values({
            name: null, // Will be updated when we get more info
            phone: activity.phone,
            email: activity.email,
            lead_source: 'Organic',
            lead_medium: 'Website',
            is_high_intent: true,
            pipeline_stage: 'Raw lead',
            request_type: 'Product enquiry',
            urgency_level: 'High',
            lead_score: activity.intent_score,
            notes: `Auto-created from high-intent browser activity. Session: ${activity.session_id}`,
            is_anonymous: !activity.user_id
          })
          .execute();
      }
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Lead promotion failed:', error);
    }
  }
}
