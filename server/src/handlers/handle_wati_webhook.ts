
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type WatiWebhookPayload, type Lead } from '../schema';

export async function handleWatiWebhook(payload: WatiWebhookPayload): Promise<Lead> {
  try {
    // Insert new lead record with WATI source
    const result = await db.insert(leadsTable)
      .values({
        name: payload.name,
        phone: payload.phone,
        email: null,
        lead_source: 'WATI',
        lead_medium: 'WhatsApp',
        is_high_intent: false,
        pipeline_stage: 'In Contact',
        genuine_lead_status: null,
        follow_up_status: null,
        request_type: 'Product enquiry', // Default assumption for WATI leads
        urgency_level: 'Medium',
        special_date: null,
        occasion: null,
        lead_score: 50, // Base score for WATI leads
        notes: payload.message ? `Initial message: ${payload.message}` : null,
        assigned_to: null,
        last_contacted_at: new Date(),
        next_follow_up_at: null,
        is_anonymous: false,
        wati_contact_id: payload.contact_id,
        periskope_contact_id: null
      })
      .returning()
      .execute();

    const lead = result[0];
    return {
      ...lead,
      // Dates are already Date objects from the database
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      last_contacted_at: lead.last_contacted_at,
      next_follow_up_at: lead.next_follow_up_at,
      special_date: lead.special_date
    };
  } catch (error) {
    console.error('WATI webhook processing failed:', error);
    throw error;
  }
}
