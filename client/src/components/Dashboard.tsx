
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Users, TrendingUp, DollarSign, Phone, Calendar, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Lead, Order, BrowserActivity, CalendarEvent } from '../../../server/src/schema';

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [browserActivities, setBrowserActivities] = useState<BrowserActivity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leadsData, ordersData, browserData, calendarData] = await Promise.all([
        trpc.getLeads.query(),
        trpc.getOrders.query(),
        trpc.getBrowserActivities.query(),
        trpc.getCalendarEvents.query()
      ]);
      
      setLeads(leadsData);
      setOrders(ordersData);
      setBrowserActivities(browserData);
      setCalendarEvents(calendarData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate metrics (showing structure with stub data)
  const totalLeads = leads.length;
  const highIntentLeads = leads.filter(lead => lead.is_high_intent).length;
  const genuineLeads = leads.filter(lead => lead.pipeline_stage === 'Genuine Lead').length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.order_status === 'Pending').length;
  const todayEvents = calendarEvents.filter(event => {
    const today = new Date().toDateString();
    return event.start_time.toDateString() === today;
  }).length;

  const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">💎 Your diamond business at a glance</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalLeads}</div>
            <p className="text-xs text-blue-600 mt-1">
              {highIntentLeads} high intent leads
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Genuine Leads</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{genuineLeads}</div>
            <p className="text-xs text-green-600 mt-1">
              Qualified prospects
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Active Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{totalOrders}</div>
            <p className="text-xs text-orange-600 mt-1">
              {pendingOrders} pending orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Today's Events</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{todayEvents}</div>
            <p className="text-xs text-purple-600 mt-1">
              Scheduled activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>Lead to order conversion tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Leads</span>
                <span>{totalLeads}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Genuine Leads</span>
                <span>{genuineLeads}</span>
              </div>
              <Progress value={totalLeads > 0 ? (genuineLeads / totalLeads) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Converted Orders</span>
                <span>{totalOrders}</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">
                Conversion Rate: <span className="font-semibold text-green-600">{conversionRate.toFixed(1)}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-cyan-600" />
              High Intent Browser Activity
            </CardTitle>
            <CardDescription>Recent website visitors showing purchase intent</CardDescription>
          </CardHeader>
          <CardContent>
            {browserActivities.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No browser activities detected yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  📊 Data will appear here when Nitro Analytics integration provides browsing data
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {browserActivities.slice(0, 5).map((activity: BrowserActivity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.activity_type}</p>
                      <p className="text-xs text-gray-500">{activity.phone || 'Anonymous'}</p>
                    </div>
                    <Badge variant={activity.intent_score > 7 ? 'destructive' : 'secondary'}>
                      Score: {activity.intent_score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm">Add New Lead</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Phone className="h-6 w-6 text-green-600" />
              <span className="text-sm">Send WhatsApp</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="text-sm">Schedule Follow-up</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <DollarSign className="h-6 w-6 text-orange-600" />
              <span className="text-sm">Create Order</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      {totalLeads === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  🔧 Demo Mode Active
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This is a fully functional CRM interface. Backend handlers are currently stubs and will return empty data. 
                  All UI components and workflows are ready for real data integration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
