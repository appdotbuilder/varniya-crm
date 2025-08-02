
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { getLeads } from '../handlers/get_leads';

describe('getLeads', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no leads exist', async () => {
    const result = await getLeads();
    expect(result).toEqual([]);
  });

  it('should return all leads', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test leads
    await db.insert(leadsTable)
      .values([
        {
          name: 'Lead 1',
          phone: '1234567890',
          email: 'lead1@example.com',
          lead_source: 'Google',
          lead_medium: 'Website',
          request_type: 'Product enquiry',
          assigned_to: userId
        },
        {
          name: 'Lead 2',
          phone: '0987654321',
          email: 'lead2@example.com',
          lead_source: 'Meta',
          lead_medium: 'Social Media',
          request_type: 'Request for information',
          pipeline_stage: 'In Contact'
        }
      ])
      .execute();

    const result = await getLeads();

    expect(result).toHaveLength(2);
    
    // Verify first lead
    expect(result[0].name).toEqual('Lead 1');
    expect(result[0].phone).toEqual('1234567890');
    expect(result[0].email).toEqual('lead1@example.com');
    expect(result[0].lead_source).toEqual('Google');
    expect(result[0].lead_medium).toEqual('Website');
    expect(result[0].request_type).toEqual('Product enquiry');
    expect(result[0].assigned_to).toEqual(userId);
    expect(result[0].pipeline_stage).toEqual('Raw lead'); // Default value
    expect(result[0].urgency_level).toEqual('Medium'); // Default value
    expect(result[0].is_high_intent).toEqual(false); // Default value
    expect(result[0].lead_score).toEqual(0); // Default value

    // Verify second lead
    expect(result[1].name).toEqual('Lead 2');
    expect(result[1].phone).toEqual('0987654321');
    expect(result[1].email).toEqual('lead2@example.com');
    expect(result[1].lead_source).toEqual('Meta');
    expect(result[1].lead_medium).toEqual('Social Media');
    expect(result[1].request_type).toEqual('Request for information');
    expect(result[1].pipeline_stage).toEqual('In Contact');
    expect(result[1].assigned_to).toBeNull();

    // Verify timestamps are present
    result.forEach(lead => {
      expect(lead.id).toBeDefined();
      expect(lead.created_at).toBeInstanceOf(Date);
      expect(lead.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle leads with nullable fields', async () => {
    // Create lead with minimal required fields
    await db.insert(leadsTable)
      .values({
        name: null,
        phone: null,
        email: null,
        lead_source: 'Direct/Unknown',
        lead_medium: 'Direct',
        request_type: 'Other',
        special_date: null,
        occasion: null,
        notes: null,
        assigned_to: null,
        wati_contact_id: null,
        periskope_contact_id: null
      })
      .execute();

    const result = await getLeads();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].special_date).toBeNull();
    expect(result[0].occasion).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].assigned_to).toBeNull();
    expect(result[0].wati_contact_id).toBeNull();
    expect(result[0].periskope_contact_id).toBeNull();
  });

  it('should handle leads with special dates and follow-up times', async () => {
    const specialDate = new Date('2024-12-25');
    const followUpDate = new Date('2024-01-15');
    const lastContactedDate = new Date('2024-01-10');

    await db.insert(leadsTable)
      .values({
        name: 'Holiday Lead',
        phone: '1111111111',
        email: 'holiday@example.com',
        lead_source: 'SEO',
        lead_medium: 'Website',
        request_type: 'Product enquiry',
        special_date: specialDate,
        occasion: 'Christmas',
        next_follow_up_at: followUpDate,
        last_contacted_at: lastContactedDate,
        pipeline_stage: 'Genuine Lead',
        genuine_lead_status: 'First call done',
        follow_up_status: 'Follow Up'
      })
      .execute();

    const result = await getLeads();

    expect(result).toHaveLength(1);
    expect(result[0].special_date).toEqual(specialDate);
    expect(result[0].occasion).toEqual('Christmas');
    expect(result[0].next_follow_up_at).toEqual(followUpDate);
    expect(result[0].last_contacted_at).toEqual(lastContactedDate);
    expect(result[0].pipeline_stage).toEqual('Genuine Lead');
    expect(result[0].genuine_lead_status).toEqual('First call done');
    expect(result[0].follow_up_status).toEqual('Follow Up');
  });
});
