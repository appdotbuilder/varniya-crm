
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { createLead } from '../handlers/create_lead';
import { eq } from 'drizzle-orm';

// Basic test input
const testInput: CreateLeadInput = {
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  lead_source: 'Google',
  lead_medium: 'Email',
  is_high_intent: false,
  request_type: 'Product enquiry',
  urgency_level: 'Medium',
  special_date: null,
  occasion: null,
  notes: 'Test lead creation',
  assigned_to: null,
  wati_contact_id: null
};

describe('createLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead with basic information', async () => {
    const result = await createLead(testInput);

    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('john@example.com');
    expect(result.lead_source).toEqual('Google');
    expect(result.lead_medium).toEqual('Email');
    expect(result.is_high_intent).toEqual(false);
    expect(result.request_type).toEqual('Product enquiry');
    expect(result.urgency_level).toEqual('Medium');
    expect(result.pipeline_stage).toEqual('Raw lead');
    expect(result.notes).toEqual('Test lead creation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save lead to database', async () => {
    const result = await createLead(testInput);

    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].name).toEqual('John Doe');
    expect(leads[0].phone).toEqual('+1234567890');
    expect(leads[0].email).toEqual('john@example.com');
    expect(leads[0].lead_source).toEqual('Google');
    expect(leads[0].lead_medium).toEqual('Email');
    expect(leads[0].pipeline_stage).toEqual('Raw lead');
  });

  it('should calculate lead score based on source and medium', async () => {
    const result = await createLead(testInput);

    // Google source (30) + Email medium (25) + Medium urgency (5) = 60
    expect(result.lead_score).toEqual(60);

    // Test higher scoring combination
    const highScoreInput: CreateLeadInput = {
      ...testInput,
      lead_source: 'Direct/Unknown', // 50 points
      lead_medium: 'Phone', // 30 points
      urgency_level: 'Urgent' // 15 points
    };

    const highScoreResult = await createLead(highScoreInput);
    expect(highScoreResult.lead_score).toEqual(95); // 50 + 30 + 15
  });

  it('should add bonus for high intent leads', async () => {
    const highIntentInput: CreateLeadInput = {
      ...testInput,
      is_high_intent: true
    };

    const result = await createLead(highIntentInput);

    // Google (30) + Email (25) + Medium urgency (5) + High intent (20) = 80
    expect(result.lead_score).toEqual(80);
    expect(result.is_high_intent).toEqual(true);
  });

  it('should handle user assignment correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Sales Agent',
        email: 'agent@example.com',
        role: 'Sales Agent',
        phone: '+1111111111'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const assignedInput: CreateLeadInput = {
      ...testInput,
      assigned_to: userId
    };

    const result = await createLead(assignedInput);

    expect(result.assigned_to).toEqual(userId);

    // Verify in database
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads[0].assigned_to).toEqual(userId);
  });

  it('should handle nullable fields correctly', async () => {
    const minimalInput: CreateLeadInput = {
      name: null,
      phone: null,
      email: null,
      lead_source: 'SEO',
      lead_medium: 'Website',
      request_type: 'Request for information'
    };

    const result = await createLead(minimalInput);

    expect(result.name).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.is_high_intent).toEqual(false); // Default value
    expect(result.urgency_level).toEqual('Medium'); // Default value
    expect(result.special_date).toBeNull();
    expect(result.occasion).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.wati_contact_id).toBeNull();
  });

  it('should handle special date and occasion', async () => {
    const specialDate = new Date('2024-12-25');
    const specialInput: CreateLeadInput = {
      ...testInput,
      special_date: specialDate,
      occasion: 'Christmas'
    };

    const result = await createLead(specialInput);

    expect(result.special_date).toEqual(specialDate);
    expect(result.occasion).toEqual('Christmas');
  });

  it('should handle WATI contact ID', async () => {
    const watiInput: CreateLeadInput = {
      ...testInput,
      lead_source: 'WATI',
      lead_medium: 'WhatsApp',
      wati_contact_id: 'wati_12345'
    };

    const result = await createLead(watiInput);

    expect(result.wati_contact_id).toEqual('wati_12345');
    expect(result.lead_source).toEqual('WATI');
    expect(result.lead_medium).toEqual('WhatsApp');
  });

  it('should calculate different scores for different sources', async () => {
    // Test Direct/Unknown (highest score)
    const directInput: CreateLeadInput = {
      ...testInput,
      lead_source: 'Direct/Unknown',
      lead_medium: 'Direct'
    };
    const directResult = await createLead(directInput);
    expect(directResult.lead_score).toEqual(60); // 50 + 5 + 5

    // Test WATI (lowest score)
    const watiInput: CreateLeadInput = {
      ...testInput,
      lead_source: 'WATI',
      lead_medium: 'WhatsApp'
    };
    const watiResult = await createLead(watiInput);
    expect(watiResult.lead_score).toEqual(45); // 20 + 20 + 5
  });

  it('should set default values for optional fields', async () => {
    const result = await createLead(testInput);

    expect(result.is_anonymous).toEqual(false);
    expect(result.pipeline_stage).toEqual('Raw lead');
    expect(result.genuine_lead_status).toBeNull();
    expect(result.follow_up_status).toBeNull();
    expect(result.last_contacted_at).toBeNull();
    expect(result.next_follow_up_at).toBeNull();
    expect(result.periskope_contact_id).toBeNull();
  });
});
