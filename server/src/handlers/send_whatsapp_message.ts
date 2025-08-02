
import { db } from '../db';
import { communicationLogsTable, leadsTable, ordersTable, usersTable } from '../db/schema';
import { type CommunicationLog } from '../schema';
import { eq } from 'drizzle-orm';

interface SendWhatsAppMessageInput {
    lead_id?: number;
    order_id?: number;
    phone: string;
    message: string;
    template_name?: string;
    sent_by: number;
}

export async function sendWhatsAppMessage(input: SendWhatsAppMessageInput): Promise<CommunicationLog> {
    try {
        // Validate that the user exists
        const user = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, input.sent_by))
            .execute();

        if (user.length === 0) {
            throw new Error(`User with ID ${input.sent_by} not found`);
        }

        // Validate lead exists if provided
        if (input.lead_id) {
            const lead = await db.select()
                .from(leadsTable)
                .where(eq(leadsTable.id, input.lead_id))
                .execute();

            if (lead.length === 0) {
                throw new Error(`Lead with ID ${input.lead_id} not found`);
            }
        }

        // Validate order exists if provided
        if (input.order_id) {
            const order = await db.select()
                .from(ordersTable)
                .where(eq(ordersTable.id, input.order_id))
                .execute();

            if (order.length === 0) {
                throw new Error(`Order with ID ${input.order_id} not found`);
            }
        }

        // Simulate external WhatsApp API call
        // In real implementation, this would call WATI/Periskope API
        const externalMessageId = await sendToExternalAPI(input);

        // Log the communication in database
        const result = await db.insert(communicationLogsTable)
            .values({
                lead_id: input.lead_id || null,
                order_id: input.order_id || null,
                communication_type: 'WhatsApp',
                direction: 'Outbound',
                message_content: input.message,
                template_name: input.template_name || null,
                status: 'Sent',
                sent_by: input.sent_by,
                external_message_id: externalMessageId
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('WhatsApp message sending failed:', error);
        throw error;
    }
}

// Simulate external API call - in real implementation this would call WATI/Periskope
async function sendToExternalAPI(input: SendWhatsAppMessageInput): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate potential API failure for testing
    if (input.phone === 'INVALID_PHONE') {
        throw new Error('External API error: Invalid phone number');
    }
    
    // Return simulated external message ID
    return `ext_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
