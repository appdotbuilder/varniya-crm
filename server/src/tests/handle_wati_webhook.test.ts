
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type WatiWebhookPayload } from '../schema';
import { handleWatiWebhook } from '../handlers/handle_wati_webhook';
import { eq } from 'drizzle-orm';

// Test payload for WATI webhook
const testPayload: WatiWebhookPayload = {
  contact_id: 'wati_12345',
  phone: '+919876543210',
  name: 'John Doe',
  message: 'Hi, I need some flowers for my wedding',
  timestamp: '2024-01-15T10:30:00Z'
};

describe('handleWatiWebhook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead from WATI webhook', async () => {
    const result = await handleWatiWebhook(testPayload);

    // Verify lead creation
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('+919876543210');
    expect(result.email).toBeNull();
    expect(result.lead_source).toEqual('WATI');
    expect(result.lead_medium).toEqual('WhatsApp');
    expect(result.pipeline_stage).toEqual('In Contact');
    expect(result.request_type).toEqual('Product enquiry');
    expect(result.urgency_level).toEqual('Medium');
    expect(result.lead_score).toEqual(50);
    expect(result.wati_contact_id).toEqual('wati_12345');
    expect(result.is_high_intent).toBe(false);
    expect(result.is_anonymous).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.last_contacted_at).toBeInstanceOf(Date);
  });

  it('should save lead to database', async () => {
    const result = await handleWatiWebhook(testPayload);

    // Query database to verify persistence
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads).toHaveLength(1);
    const savedLead = leads[0];
    expect(savedLead.name).toEqual('John Doe');
    expect(savedLead.phone).toEqual('+919876543210');
    expect(savedLead.lead_source).toEqual('WATI');
    expect(savedLead.lead_medium).toEqual('WhatsApp');
    expect(savedLead.pipeline_stage).toEqual('In Contact');
    expect(savedLead.wati_contact_id).toEqual('wati_12345');
    expect(savedLead.lead_score).toEqual(50);
    expect(savedLead.last_contacted_at).toBeInstanceOf(Date);
  });

  it('should handle message in notes', async () => {
    const result = await handleWatiWebhook(testPayload);

    expect(result.notes).toEqual('Initial message: Hi, I need some flowers for my wedding');
  });

  it('should handle null message', async () => {
    const payloadWithoutMessage: WatiWebhookPayload = {
      ...testPayload,
      message: null
    };

    const result = await handleWatiWebhook(payloadWithoutMessage);

    expect(result.notes).toBeNull();
  });

  it('should handle null name', async () => {
    const payloadWithoutName: WatiWebhookPayload = {
      ...testPayload,
      name: null
    };

    const result = await handleWatiWebhook(payloadWithoutName);

    expect(result.name).toBeNull();
    expect(result.phone).toEqual('+919876543210');
    expect(result.wati_contact_id).toEqual('wati_12345');
  });

  it('should set correct default values', async () => {
    const result = await handleWatiWebhook(testPayload);

    // Verify all default values are set correctly
    expect(result.genuine_lead_status).toBeNull();
    expect(result.follow_up_status).toBeNull();
    expect(result.special_date).toBeNull();
    expect(result.occasion).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.next_follow_up_at).toBeNull();
    expect(result.periskope_contact_id).toBeNull();
  });
});
