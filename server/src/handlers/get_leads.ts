
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type Lead } from '../schema';
import { eq } from 'drizzle-orm';

export async function getLeads(): Promise<Lead[]> {
  try {
    // Join with users table to get assigned user information
    const results = await db.select({
      id: leadsTable.id,
      name: leadsTable.name,
      phone: leadsTable.phone,
      email: leadsTable.email,
      lead_source: leadsTable.lead_source,
      lead_medium: leadsTable.lead_medium,
      is_high_intent: leadsTable.is_high_intent,
      pipeline_stage: leadsTable.pipeline_stage,
      genuine_lead_status: leadsTable.genuine_lead_status,
      follow_up_status: leadsTable.follow_up_status,
      request_type: leadsTable.request_type,
      urgency_level: leadsTable.urgency_level,
      special_date: leadsTable.special_date,
      occasion: leadsTable.occasion,
      lead_score: leadsTable.lead_score,
      notes: leadsTable.notes,
      assigned_to: leadsTable.assigned_to,
      created_at: leadsTable.created_at,
      updated_at: leadsTable.updated_at,
      last_contacted_at: leadsTable.last_contacted_at,
      next_follow_up_at: leadsTable.next_follow_up_at,
      is_anonymous: leadsTable.is_anonymous,
      wati_contact_id: leadsTable.wati_contact_id,
      periskope_contact_id: leadsTable.periskope_contact_id
    })
    .from(leadsTable)
    .leftJoin(usersTable, eq(leadsTable.assigned_to, usersTable.id))
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    throw error;
  }
}
