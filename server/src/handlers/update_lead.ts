
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type UpdateLeadInput, type Lead } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLead = async (input: UpdateLeadInput): Promise<Lead> => {
  try {
    // Update the lead with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    // Only include fields that are actually provided in the input
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.pipeline_stage !== undefined) updateData.pipeline_stage = input.pipeline_stage;
    if (input.genuine_lead_status !== undefined) updateData.genuine_lead_status = input.genuine_lead_status;
    if (input.follow_up_status !== undefined) updateData.follow_up_status = input.follow_up_status;
    if (input.urgency_level !== undefined) updateData.urgency_level = input.urgency_level;
    if (input.lead_score !== undefined) updateData.lead_score = input.lead_score;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;
    if (input.next_follow_up_at !== undefined) updateData.next_follow_up_at = input.next_follow_up_at;
    if (input.periskope_contact_id !== undefined) updateData.periskope_contact_id = input.periskope_contact_id;

    const result = await db.update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Lead with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Lead update failed:', error);
    throw error;
  }
};
