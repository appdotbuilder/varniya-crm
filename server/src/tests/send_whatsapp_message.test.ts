
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, ordersTable, communicationLogsTable } from '../db/schema';
import { sendWhatsAppMessage } from '../handlers/send_whatsapp_message';
import { eq } from 'drizzle-orm';

describe('sendWhatsAppMessage', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    let testUser: any;
    let testLead: any;
    let testOrder: any;

    beforeEach(async () => {
        // Create test user
        const userResult = await db.insert(usersTable)
            .values({
                name: 'Test Agent',
                email: 'agent@test.com',
                role: 'Sales Agent',
                phone: '+1234567890'
            })
            .returning()
            .execute();
        testUser = userResult[0];

        // Create test lead
        const leadResult = await db.insert(leadsTable)
            .values({
                name: 'Test Lead',
                phone: '+9876543210',
                email: 'lead@test.com',
                lead_source: 'WATI',
                lead_medium: 'WhatsApp',
                request_type: 'Product enquiry',
                assigned_to: testUser.id
            })
            .returning()
            .execute();
        testLead = leadResult[0];

        // Create test order
        const orderResult = await db.insert(ordersTable)
            .values({
                lead_id: testLead.id,
                order_number: 'ORD-001',
                product_details: '{"items": [{"name": "Test Product", "quantity": 1}]}',
                total_amount: '1000.00'
            })
            .returning()
            .execute();
        testOrder = orderResult[0];
    });

    it('should send WhatsApp message and log communication', async () => {
        const input = {
            lead_id: testLead.id,
            phone: '+9876543210',
            message: 'Hello, this is a test message',
            sent_by: testUser.id
        };

        const result = await sendWhatsAppMessage(input);

        // Verify returned communication log
        expect(result.id).toBeDefined();
        expect(result.lead_id).toEqual(testLead.id);
        expect(result.order_id).toBeNull();
        expect(result.communication_type).toEqual('WhatsApp');
        expect(result.direction).toEqual('Outbound');
        expect(result.message_content).toEqual('Hello, this is a test message');
        expect(result.template_name).toBeNull();
        expect(result.status).toEqual('Sent');
        expect(result.sent_by).toEqual(testUser.id);
        expect(result.external_message_id).toBeDefined();
        expect(result.external_message_id).toMatch(/^ext_msg_/);
        expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should send message with template name', async () => {
        const input = {
            order_id: testOrder.id,
            phone: '+9876543210',
            message: 'Your order is confirmed',
            template_name: 'order_confirmation',
            sent_by: testUser.id
        };

        const result = await sendWhatsAppMessage(input);

        expect(result.order_id).toEqual(testOrder.id);
        expect(result.lead_id).toBeNull();
        expect(result.template_name).toEqual('order_confirmation');
        expect(result.message_content).toEqual('Your order is confirmed');
    });

    it('should save communication log to database', async () => {
        const input = {
            lead_id: testLead.id,
            phone: '+9876543210',
            message: 'Database test message',
            sent_by: testUser.id
        };

        const result = await sendWhatsAppMessage(input);

        // Verify record exists in database
        const logs = await db.select()
            .from(communicationLogsTable)
            .where(eq(communicationLogsTable.id, result.id))
            .execute();

        expect(logs).toHaveLength(1);
        expect(logs[0].lead_id).toEqual(testLead.id);
        expect(logs[0].communication_type).toEqual('WhatsApp');
        expect(logs[0].direction).toEqual('Outbound');
        expect(logs[0].message_content).toEqual('Database test message');
        expect(logs[0].sent_by).toEqual(testUser.id);
    });

    it('should handle message without lead or order', async () => {
        const input = {
            phone: '+1111111111',
            message: 'Standalone message',
            sent_by: testUser.id
        };

        const result = await sendWhatsAppMessage(input);

        expect(result.lead_id).toBeNull();
        expect(result.order_id).toBeNull();
        expect(result.message_content).toEqual('Standalone message');
        expect(result.sent_by).toEqual(testUser.id);
    });

    it('should throw error for invalid user', async () => {
        const input = {
            phone: '+9876543210',
            message: 'Test message',
            sent_by: 99999 // Non-existent user ID
        };

        await expect(sendWhatsAppMessage(input)).rejects.toThrow(/User with ID 99999 not found/i);
    });

    it('should throw error for invalid lead', async () => {
        const input = {
            lead_id: 99999, // Non-existent lead ID
            phone: '+9876543210',
            message: 'Test message',
            sent_by: testUser.id
        };

        await expect(sendWhatsAppMessage(input)).rejects.toThrow(/Lead with ID 99999 not found/i);
    });

    it('should throw error for invalid order', async () => {
        const input = {
            order_id: 99999, // Non-existent order ID
            phone: '+9876543210',
            message: 'Test message',
            sent_by: testUser.id
        };

        await expect(sendWhatsAppMessage(input)).rejects.toThrow(/Order with ID 99999 not found/i);
    });

    it('should handle external API failure', async () => {
        const input = {
            phone: 'INVALID_PHONE', // This triggers API failure in mock
            message: 'Test message',
            sent_by: testUser.id
        };

        await expect(sendWhatsAppMessage(input)).rejects.toThrow(/External API error/i);
    });
});
