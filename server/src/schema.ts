
import { z } from 'zod';

// Enums for various categorical fields
export const leadSourceSchema = z.enum(['WATI', 'Google', 'Meta', 'SEO', 'Organic', 'Direct/Unknown']);
export const leadMediumSchema = z.enum(['WhatsApp', 'Email', 'Phone', 'Website', 'Social Media', 'Direct']);
export const pipelineStageSchema = z.enum(['Raw lead', 'In Contact', 'Not Interested', 'No Response', 'Junk', 'Genuine Lead']);
export const genuineLeadStatusSchema = z.enum(['First call done', 'Estimates shared', 'Disqualified']);
export const followUpStatusSchema = z.enum(['Follow Up', 'Gone Cold', 'Sale Completed']);
export const requestTypeSchema = z.enum(['Product enquiry', 'Request for information', 'Suggestions', 'Other']);
export const urgencyLevelSchema = z.enum(['Low', 'Medium', 'High', 'Urgent']);
export const orderStatusSchema = z.enum(['Pending', 'Confirmed', 'In Production', 'Ready for Delivery', 'Delivered', 'Cancelled']);
export const paymentStatusSchema = z.enum(['Pending', 'Partial', 'Paid', 'Refunded']);
export const userRoleSchema = z.enum(['Marketing', 'Operations', 'Sales', 'Sales Agent', 'Customer Service']);

// Lead schema
export const leadSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  lead_source: leadSourceSchema,
  lead_medium: leadMediumSchema,
  is_high_intent: z.boolean().default(false),
  pipeline_stage: pipelineStageSchema,
  genuine_lead_status: genuineLeadStatusSchema.nullable(),
  follow_up_status: followUpStatusSchema.nullable(),
  request_type: requestTypeSchema,
  urgency_level: urgencyLevelSchema.default('Medium'),
  special_date: z.coerce.date().nullable(),
  occasion: z.string().nullable(),
  lead_score: z.number().default(0),
  notes: z.string().nullable(),
  assigned_to: z.number().nullable(), // User ID
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  last_contacted_at: z.coerce.date().nullable(),
  next_follow_up_at: z.coerce.date().nullable(),
  is_anonymous: z.boolean().default(false),
  wati_contact_id: z.string().nullable(),
  periskope_contact_id: z.string().nullable()
});

export type Lead = z.infer<typeof leadSchema>;

// Input schemas for lead operations
export const createLeadInputSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  lead_source: leadSourceSchema,
  lead_medium: leadMediumSchema,
  is_high_intent: z.boolean().optional(),
  request_type: requestTypeSchema,
  urgency_level: urgencyLevelSchema.optional(),
  special_date: z.coerce.date().nullable().optional(),
  occasion: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.number().nullable().optional(),
  wati_contact_id: z.string().nullable().optional()
});

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;

export const updateLeadInputSchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  pipeline_stage: pipelineStageSchema.optional(),
  genuine_lead_status: genuineLeadStatusSchema.nullable().optional(),
  follow_up_status: followUpStatusSchema.nullable().optional(),
  urgency_level: urgencyLevelSchema.optional(),
  lead_score: z.number().optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.number().nullable().optional(),
  next_follow_up_at: z.coerce.date().nullable().optional(),
  periskope_contact_id: z.string().nullable().optional()
});

export type UpdateLeadInput = z.infer<typeof updateLeadInputSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  phone: z.string().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  lead_id: z.number(),
  order_number: z.string(),
  product_details: z.string(), // JSON string of product information
  total_amount: z.number(),
  advance_amount: z.number().nullable(),
  balance_amount: z.number().nullable(),
  payment_status: paymentStatusSchema,
  order_status: orderStatusSchema,
  delivery_date: z.coerce.date().nullable(),
  actual_delivery_date: z.coerce.date().nullable(),
  sla_breach: z.boolean().default(false),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  lead_id: z.number(),
  product_details: z.string(),
  total_amount: z.number().positive(),
  advance_amount: z.number().positive().optional(),
  delivery_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Browser activity schema (from Nitro Analytics)
export const browserActivitySchema = z.object({
  id: z.number(),
  session_id: z.string(),
  user_id: z.string().nullable(), // Anonymous users might not have user_id
  phone: z.string().nullable(),
  email: z.string().nullable(),
  activity_type: z.enum(['Add to Cart', 'Browsed multiple Products', 'Multiple website visits', 'Product View']),
  product_data: z.string().nullable(), // JSON string of product information
  activity_count: z.number().default(1),
  intent_score: z.number().default(0),
  first_activity_at: z.coerce.date(),
  last_activity_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type BrowserActivity = z.infer<typeof browserActivitySchema>;

export const createBrowserActivityInputSchema = z.object({
  session_id: z.string(),
  user_id: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  activity_type: z.enum(['Add to Cart', 'Browsed multiple Products', 'Multiple website visits', 'Product View']),
  product_data: z.string().nullable().optional(),
  activity_count: z.number().optional(),
  intent_score: z.number().optional()
});

export type CreateBrowserActivityInput = z.infer<typeof createBrowserActivityInputSchema>;

// Communication log schema
export const communicationLogSchema = z.object({
  id: z.number(),
  lead_id: z.number().nullable(),
  order_id: z.number().nullable(),
  communication_type: z.enum(['WhatsApp', 'Email', 'Phone', 'SMS']),
  direction: z.enum(['Inbound', 'Outbound']),
  message_content: z.string().nullable(),
  template_name: z.string().nullable(),
  status: z.enum(['Sent', 'Delivered', 'Read', 'Failed']),
  sent_by: z.number().nullable(), // User ID
  external_message_id: z.string().nullable(), // WATI/Periskope message ID
  created_at: z.coerce.date()
});

export type CommunicationLog = z.infer<typeof communicationLogSchema>;

// Design bank schema
export const designSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  subcategory: z.string().nullable(),
  image_url: z.string(),
  description: z.string().nullable(),
  price_range_min: z.number().nullable(),
  price_range_max: z.number().nullable(),
  tags: z.string().nullable(), // JSON string of tags array
  is_active: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Design = z.infer<typeof designSchema>;

export const createDesignInputSchema = z.object({
  name: z.string(),
  category: z.string(),
  subcategory: z.string().nullable().optional(),
  image_url: z.string(),
  description: z.string().nullable().optional(),
  price_range_min: z.number().nullable().optional(),
  price_range_max: z.number().nullable().optional(),
  tags: z.string().nullable().optional()
});

export type CreateDesignInput = z.infer<typeof createDesignInputSchema>;

// Calendar event schema
export const calendarEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  event_type: z.enum(['Follow Up', 'Meeting', 'Call', 'Delivery', 'Other']),
  lead_id: z.number().nullable(),
  order_id: z.number().nullable(),
  assigned_to: z.number(), // User ID
  created_by: z.number(), // User ID
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const createCalendarEventInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  event_type: z.enum(['Follow Up', 'Meeting', 'Call', 'Delivery', 'Other']),
  lead_id: z.number().nullable().optional(),
  order_id: z.number().nullable().optional(),
  assigned_to: z.number()
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventInputSchema>;

// Webhook payload schemas
export const watiWebhookPayloadSchema = z.object({
  contact_id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  message: z.string().nullable(),
  timestamp: z.string()
});

export type WatiWebhookPayload = z.infer<typeof watiWebhookPayloadSchema>;

export const nitroWebhookPayloadSchema = z.object({
  session_id: z.string(),
  user_id: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  activity_type: z.string(),
  product_data: z.any().nullable(),
  timestamp: z.string()
});

export type NitroWebhookPayload = z.infer<typeof nitroWebhookPayloadSchema>;
