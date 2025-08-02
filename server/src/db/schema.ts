
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const leadSourceEnum = pgEnum('lead_source', ['WATI', 'Google', 'Meta', 'SEO', 'Organic', 'Direct/Unknown']);
export const leadMediumEnum = pgEnum('lead_medium', ['WhatsApp', 'Email', 'Phone', 'Website', 'Social Media', 'Direct']);
export const pipelineStageEnum = pgEnum('pipeline_stage', ['Raw lead', 'In Contact', 'Not Interested', 'No Response', 'Junk', 'Genuine Lead']);
export const genuineLeadStatusEnum = pgEnum('genuine_lead_status', ['First call done', 'Estimates shared', 'Disqualified']);
export const followUpStatusEnum = pgEnum('follow_up_status', ['Follow Up', 'Gone Cold', 'Sale Completed']);
export const requestTypeEnum = pgEnum('request_type', ['Product enquiry', 'Request for information', 'Suggestions', 'Other']);
export const urgencyLevelEnum = pgEnum('urgency_level', ['Low', 'Medium', 'High', 'Urgent']);
export const orderStatusEnum = pgEnum('order_status', ['Pending', 'Confirmed', 'In Production', 'Ready for Delivery', 'Delivered', 'Cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['Pending', 'Partial', 'Paid', 'Refunded']);
export const userRoleEnum = pgEnum('user_role', ['Marketing', 'Operations', 'Sales', 'Sales Agent', 'Customer Service']);
export const activityTypeEnum = pgEnum('activity_type', ['Add to Cart', 'Browsed multiple Products', 'Multiple website visits', 'Product View']);
export const communicationTypeEnum = pgEnum('communication_type', ['WhatsApp', 'Email', 'Phone', 'SMS']);
export const communicationDirectionEnum = pgEnum('communication_direction', ['Inbound', 'Outbound']);
export const communicationStatusEnum = pgEnum('communication_status', ['Sent', 'Delivered', 'Read', 'Failed']);
export const eventTypeEnum = pgEnum('event_type', ['Follow Up', 'Meeting', 'Call', 'Delivery', 'Other']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  phone: text('phone'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Leads table
export const leadsTable = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name'),
  phone: text('phone'),
  email: text('email'),
  lead_source: leadSourceEnum('lead_source').notNull(),
  lead_medium: leadMediumEnum('lead_medium').notNull(),
  is_high_intent: boolean('is_high_intent').notNull().default(false),
  pipeline_stage: pipelineStageEnum('pipeline_stage').notNull().default('Raw lead'),
  genuine_lead_status: genuineLeadStatusEnum('genuine_lead_status'),
  follow_up_status: followUpStatusEnum('follow_up_status'),
  request_type: requestTypeEnum('request_type').notNull(),
  urgency_level: urgencyLevelEnum('urgency_level').notNull().default('Medium'),
  special_date: timestamp('special_date'),
  occasion: text('occasion'),
  lead_score: integer('lead_score').notNull().default(0),
  notes: text('notes'),
  assigned_to: integer('assigned_to'), // References users.id
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  last_contacted_at: timestamp('last_contacted_at'),
  next_follow_up_at: timestamp('next_follow_up_at'),
  is_anonymous: boolean('is_anonymous').notNull().default(false),
  wati_contact_id: text('wati_contact_id'),
  periskope_contact_id: text('periskope_contact_id'),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  lead_id: integer('lead_id').notNull(), // References leads.id
  order_number: text('order_number').notNull().unique(),
  product_details: text('product_details').notNull(), // JSON string
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  advance_amount: numeric('advance_amount', { precision: 10, scale: 2 }),
  balance_amount: numeric('balance_amount', { precision: 10, scale: 2 }),
  payment_status: paymentStatusEnum('payment_status').notNull().default('Pending'),
  order_status: orderStatusEnum('order_status').notNull().default('Pending'),
  delivery_date: timestamp('delivery_date'),
  actual_delivery_date: timestamp('actual_delivery_date'),
  sla_breach: boolean('sla_breach').notNull().default(false),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Browser activities table (from Nitro Analytics)
export const browserActivitiesTable = pgTable('browser_activities', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').notNull(),
  user_id: text('user_id'),
  phone: text('phone'),
  email: text('email'),
  activity_type: activityTypeEnum('activity_type').notNull(),
  product_data: text('product_data'), // JSON string
  activity_count: integer('activity_count').notNull().default(1),
  intent_score: integer('intent_score').notNull().default(0),
  first_activity_at: timestamp('first_activity_at').defaultNow().notNull(),
  last_activity_at: timestamp('last_activity_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Communication logs table
export const communicationLogsTable = pgTable('communication_logs', {
  id: serial('id').primaryKey(),
  lead_id: integer('lead_id'), // References leads.id
  order_id: integer('order_id'), // References orders.id
  communication_type: communicationTypeEnum('communication_type').notNull(),
  direction: communicationDirectionEnum('direction').notNull(),
  message_content: text('message_content'),
  template_name: text('template_name'),
  status: communicationStatusEnum('status').notNull(),
  sent_by: integer('sent_by'), // References users.id
  external_message_id: text('external_message_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Designs table (Design Bank)
export const designsTable = pgTable('designs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  image_url: text('image_url').notNull(),
  description: text('description'),
  price_range_min: numeric('price_range_min', { precision: 10, scale: 2 }),
  price_range_max: numeric('price_range_max', { precision: 10, scale: 2 }),
  tags: text('tags'), // JSON string of tags array
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Calendar events table
export const calendarEventsTable = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  event_type: eventTypeEnum('event_type').notNull(),
  lead_id: integer('lead_id'), // References leads.id
  order_id: integer('order_id'), // References orders.id
  assigned_to: integer('assigned_to').notNull(), // References users.id
  created_by: integer('created_by').notNull(), // References users.id
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  assignedLeads: many(leadsTable),
  communicationLogs: many(communicationLogsTable),
  calendarEvents: many(calendarEventsTable),
  createdEvents: many(calendarEventsTable),
}));

export const leadsRelations = relations(leadsTable, ({ one, many }) => ({
  assignedTo: one(usersTable, {
    fields: [leadsTable.assigned_to],
    references: [usersTable.id],
  }),
  orders: many(ordersTable),
  communicationLogs: many(communicationLogsTable),
  calendarEvents: many(calendarEventsTable),
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  lead: one(leadsTable, {
    fields: [ordersTable.lead_id],
    references: [leadsTable.id],
  }),
  communicationLogs: many(communicationLogsTable),
  calendarEvents: many(calendarEventsTable),
}));

export const communicationLogsRelations = relations(communicationLogsTable, ({ one }) => ({
  lead: one(leadsTable, {
    fields: [communicationLogsTable.lead_id],
    references: [leadsTable.id],
  }),
  order: one(ordersTable, {
    fields: [communicationLogsTable.order_id],
    references: [ordersTable.id],
  }),
  sentBy: one(usersTable, {
    fields: [communicationLogsTable.sent_by],
    references: [usersTable.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEventsTable, ({ one }) => ({
  lead: one(leadsTable, {
    fields: [calendarEventsTable.lead_id],
    references: [leadsTable.id],
  }),
  order: one(ordersTable, {
    fields: [calendarEventsTable.order_id],
    references: [ordersTable.id],
  }),
  assignedTo: one(usersTable, {
    fields: [calendarEventsTable.assigned_to],
    references: [usersTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [calendarEventsTable.created_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  leads: leadsTable,
  orders: ordersTable,
  browserActivities: browserActivitiesTable,
  communicationLogs: communicationLogsTable,
  designs: designsTable,
  calendarEvents: calendarEventsTable,
};

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Lead = typeof leadsTable.$inferSelect;
export type NewLead = typeof leadsTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;
export type BrowserActivity = typeof browserActivitiesTable.$inferSelect;
export type NewBrowserActivity = typeof browserActivitiesTable.$inferInsert;
export type CommunicationLog = typeof communicationLogsTable.$inferSelect;
export type NewCommunicationLog = typeof communicationLogsTable.$inferInsert;
export type Design = typeof designsTable.$inferSelect;
export type NewDesign = typeof designsTable.$inferInsert;
export type CalendarEvent = typeof calendarEventsTable.$inferSelect;
export type NewCalendarEvent = typeof calendarEventsTable.$inferInsert;
