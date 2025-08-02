
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type UpdateLeadInput } from '../schema';
import { updateLead } from '../handlers/update_lead';
import { eq } from 'drizzle-orm';

describe('updateLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic lead fields', async () => {
    // Create a lead first by directly inserting into database
    const insertResult = await db.insert(leadsTable)
      .values({
        name: 'Original Name',
        phone: '+1234567890',
        email: 'original@example.com',
        lead_source: 'Google',
        lead_medium: 'Email',
        request_type: 'Product enquiry',
        notes: 'Original notes'
      })
      .returning()
      .execute();

    const createdLead = insertResult[0];

    // Update the lead
    const updateInput: UpdateLeadInput = {
      id: createdLead.id,
      name: 'Updated Name',
      phone: '+0987654321',
      email: 'updated@example.com',
      notes: 'Updated notes'
    };

    const result = await updateLead(updateInput);

    expect(result.id).toEqual(createdLead.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.phone).toEqual('+0987654321');
    expect(result.email).toEqual('updated@example.com');
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdLead.updated_at).toBe(true);
  });

  it('should update pipeline stage and status fields', async () => {
    // Create a user for assignment
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'user@example.com',
        role: 'Sales'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a lead first
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '+1234567890',
        email: 'test@example.com',
        lead_source: 'WATI',
        lead_medium: 'WhatsApp',
        request_type: 'Product enquiry'
      })
      .returning()
      .execute();

    const createdLead = leadResult[0];

    // Update pipeline and status fields
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 3);

    const updateInput: UpdateLeadInput = {
      id: createdLead.id,
      pipeline_stage: 'Genuine Lead',
      genuine_lead_status: 'First call done',
      follow_up_status: 'Follow Up',
      urgency_level: 'High',
      lead_score: 85,
      assigned_to: user.id,
      next_follow_up_at: nextFollowUp,
      periskope_contact_id: 'periskope_123'
    };

    const result = await updateLead(updateInput);

    expect(result.pipeline_stage).toEqual('Genuine Lead');
    expect(result.genuine_lead_status).toEqual('First call done');
    expect(result.follow_up_status).toEqual('Follow Up');
    expect(result.urgency_level).toEqual('High');
    expect(result.lead_score).toEqual(85);
    expect(result.assigned_to).toEqual(user.id);
    expect(result.next_follow_up_at).toEqual(nextFollowUp);
    expect(result.periskope_contact_id).toEqual('periskope_123');
  });

  it('should save updated lead to database', async () => {
    // Create a lead first
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Database Test',
        phone: '+1111111111',
        email: 'db@example.com',
        lead_source: 'Meta',
        lead_medium: 'Social Media',
        request_type: 'Request for information'
      })
      .returning()
      .execute();

    const createdLead = leadResult[0];

    // Update the lead
    const updateInput: UpdateLeadInput = {
      id: createdLead.id,
      name: 'Updated Database Test',
      urgency_level: 'Urgent',
      lead_score: 95
    };

    await updateLead(updateInput);

    // Verify the update was saved to database
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, createdLead.id))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].name).toEqual('Updated Database Test');
    expect(leads[0].urgency_level).toEqual('Urgent');
    expect(leads[0].lead_score).toEqual(95);
    expect(leads[0].updated_at).toBeInstanceOf(Date);
    expect(leads[0].updated_at > createdLead.updated_at).toBe(true);
  });

  it('should update only provided fields and leave others unchanged', async () => {
    // Create a lead with all fields
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Partial Update Test',
        phone: '+2222222222',
        email: 'partial@example.com',
        lead_source: 'SEO',
        lead_medium: 'Website',
        request_type: 'Other',
        urgency_level: 'Low',
        notes: 'Original notes'
      })
      .returning()
      .execute();

    const createdLead = leadResult[0];

    // Update only specific fields
    const updateInput: UpdateLeadInput = {
      id: createdLead.id,
      urgency_level: 'High',
      lead_score: 75
    };

    const result = await updateLead(updateInput);

    // Check updated fields
    expect(result.urgency_level).toEqual('High');
    expect(result.lead_score).toEqual(75);

    // Check unchanged fields
    expect(result.name).toEqual(createdLead.name);
    expect(result.phone).toEqual(createdLead.phone);
    expect(result.email).toEqual(createdLead.email);
    expect(result.notes).toEqual(createdLead.notes);
    expect(result.lead_source).toEqual(createdLead.lead_source);
    expect(result.lead_medium).toEqual(createdLead.lead_medium);
    expect(result.request_type).toEqual(createdLead.request_type);
  });

  it('should throw error when lead does not exist', async () => {
    const updateInput: UpdateLeadInput = {
      id: 99999,
      name: 'Non-existent Lead'
    };

    await expect(updateLead(updateInput)).rejects.toThrow(/Lead with id 99999 not found/i);
  });

  it('should handle null values correctly', async () => {
    // Create a lead with some values
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Null Test',
        phone: '+3333333333',
        email: 'null@example.com',
        lead_source: 'Organic',
        lead_medium: 'Direct',
        request_type: 'Suggestions',
        notes: 'Some notes'
      })
      .returning()
      .execute();

    const createdLead = leadResult[0];

    // Update with null values
    const updateInput: UpdateLeadInput = {
      id: createdLead.id,
      name: null,
      email: null,
      notes: null,
      assigned_to: null,
      next_follow_up_at: null
    };

    const result = await updateLead(updateInput);

    expect(result.name).toBeNull();
    expect(result.email).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.next_follow_up_at).toBeNull();
    expect(result.phone).toEqual(createdLead.phone); // Should remain unchanged
  });
});
