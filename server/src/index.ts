
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createLeadInputSchema,
  updateLeadInputSchema,
  createOrderInputSchema,
  createBrowserActivityInputSchema,
  createDesignInputSchema,
  createCalendarEventInputSchema,
  watiWebhookPayloadSchema,
  nitroWebhookPayloadSchema
} from './schema';

// Import handlers
import { createLead } from './handlers/create_lead';
import { getLeads } from './handlers/get_leads';
import { updateLead } from './handlers/update_lead';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { getActiveDeals } from './handlers/get_active_deals';
import { createBrowserActivity } from './handlers/create_browser_activity';
import { getBrowserActivities } from './handlers/get_browser_activities';
import { handleWatiWebhook } from './handlers/handle_wati_webhook';
import { sendWhatsAppMessage } from './handlers/send_whatsapp_message';
import { getUsers } from './handlers/get_users';
import { createDesign } from './handlers/create_design';
import { getDesigns } from './handlers/get_designs';
import { createCalendarEvent } from './handlers/create_calendar_event';
import { getCalendarEvents } from './handlers/get_calendar_events';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Lead management
  createLead: publicProcedure
    .input(createLeadInputSchema)
    .mutation(({ input }) => createLead(input)),
  
  getLeads: publicProcedure
    .query(() => getLeads()),
  
  updateLead: publicProcedure
    .input(updateLeadInputSchema)
    .mutation(({ input }) => updateLead(input)),

  // Order management
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),
  
  getOrders: publicProcedure
    .query(() => getOrders()),
  
  getActiveDeals: publicProcedure
    .query(() => getActiveDeals()),

  // Browser activity (Nitro Analytics)
  createBrowserActivity: publicProcedure
    .input(createBrowserActivityInputSchema)
    .mutation(({ input }) => createBrowserActivity(input)),
  
  getBrowserActivities: publicProcedure
    .query(() => getBrowserActivities()),

  // Webhook handlers
  handleWatiWebhook: publicProcedure
    .input(watiWebhookPayloadSchema)
    .mutation(({ input }) => handleWatiWebhook(input)),

  // Communication
  sendWhatsAppMessage: publicProcedure
    .input(z.object({
      lead_id: z.number().optional(),
      order_id: z.number().optional(),
      phone: z.string(),
      message: z.string(),
      template_name: z.string().optional(),
      sent_by: z.number()
    }))
    .mutation(({ input }) => sendWhatsAppMessage(input)),

  // User management
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Design bank
  createDesign: publicProcedure
    .input(createDesignInputSchema)
    .mutation(({ input }) => createDesign(input)),
  
  getDesigns: publicProcedure
    .query(() => getDesigns()),

  // Calendar
  createCalendarEvent: publicProcedure
    .input(createCalendarEventInputSchema)
    .mutation(({ input, ctx }) => {
      // In real implementation, get created_by from authentication context
      const created_by = 1; // Placeholder user ID
      return createCalendarEvent(input, created_by);
    }),
  
  getCalendarEvents: publicProcedure
    .query(() => getCalendarEvents()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Varniya CRM TRPC server listening at port: ${port}`);
}

start();
