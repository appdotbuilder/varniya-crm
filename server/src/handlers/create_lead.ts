
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput, type Lead } from '../schema';

export const createLead = async (input: CreateLeadInput): Promise<Lead> => {
  try {
    // Calculate lead score based on source, medium, and intent
    let leadScore = 0;
    
    // Source scoring
    switch (input.lead_source) {
      case 'Direct/Unknown':
        leadScore += 50;
        break;
      case 'SEO':
      case 'Organic':
        leadScore += 40;
        break;
      case 'Google':
      case 'Meta':
        leadScore += 30;
        break;
      case 'WATI':
        leadScore += 20;
        break;
    }
    
    // Medium scoring
    switch (input.lead_medium) {
      case 'Phone':
        leadScore += 30;
        break;
      case 'Email':
        leadScore += 25;
        break;
      case 'WhatsApp':
        leadScore += 20;
        break;
      case 'Website':
        leadScore += 15;
        break;
      case 'Social Media':
        leadScore += 10;
        break;
      case 'Direct':
        leadScore += 5;
        break;
    }
    
    // High intent bonus
    if (input.is_high_intent) {
      leadScore += 20;
    }
    
    // Urgency bonus
    switch (input.urgency_level) {
      case 'Urgent':
        leadScore += 15;
        break;
      case 'High':
        leadScore += 10;
        break;
      case 'Medium':
        leadScore += 5;
        break;
    }

    // Insert lead record
    const result = await db.insert(leadsTable)
      .values({
        name: input.name,
        phone: input.phone,
        email: input.email,
        lead_source: input.lead_source,
        lead_medium: input.lead_medium,
        is_high_intent: input.is_high_intent ?? false,
        request_type: input.request_type,
        urgency_level: input.urgency_level ?? 'Medium',
        special_date: input.special_date ?? null,
        occasion: input.occasion ?? null,
        lead_score: leadScore,
        notes: input.notes ?? null,
        assigned_to: input.assigned_to ?? null,
        wati_contact_id: input.wati_contact_id ?? null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lead creation failed:', error);
    throw error;
  }
};
