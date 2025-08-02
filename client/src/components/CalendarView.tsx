
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { Calendar, Plus, Clock, Phone, Users, Package, AlertCircle } from 'lucide-react';
import type { CalendarEvent, CreateCalendarEventInput } from '../../../server/src/schema';

type EventType = 'Follow Up' | 'Meeting' | 'Call' | 'Delivery' | 'Other';

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState<CreateCalendarEventInput>({
    title: '',
    description: null,
    start_time: new Date(),
    end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    event_type: 'Follow Up',
    lead_id: null,
    order_id: null,
    assigned_to: 1 // Default user ID
  });

  const loadCalendarData = useCallback(async () => {
    try {
      setIsLoading(true);
      const eventsData = await trpc.getCalendarEvents.query();
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const newEvent = await trpc.createCalendarEvent.mutate(formData);
      setEvents((prev: CalendarEvent[]) => [...prev, newEvent]);
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: null,
        start_time: new Date(),
        end_time: new Date(Date.now() + 60 * 60 * 1000),
        event_type: 'Follow Up',
        lead_id: null,
        order_id: null,
        assigned_to: 1
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events by selected date
  const filteredEvents = events.filter((event: CalendarEvent) => {
    const eventDate = event.start_time.toISOString().split('T')[0];
    return eventDate === selectedDate;
  });

  const getEventTypeColor = (type: string) => {
    const colors = {
      'Follow Up': 'bg-blue-100 text-blue-800 border-blue-200',
      'Meeting': 'bg-purple-100 text-purple-800 border-purple-200',
      'Call': 'bg-green-100 text-green-800 border-green-200',
      'Delivery': 'bg-orange-100 text-orange-800 border-orange-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEventTypeIcon = (type: string) => {
    const icons = {
      'Follow Up': Phone,
      'Meeting': Users,
      'Call': Phone,
      'Delivery': Package,
      'Other': AlertCircle
    };
    return icons[type as keyof typeof icons] || AlertCircle;
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.start_time.toISOString().split('T')[0] === today);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter(event => {
      const eventDate = event.start_time;
      return eventDate > today && eventDate <= nextWeek;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-600 mt-1">📅 Schedule and track your activities</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Event</DialogTitle>
              <DialogDescription>
                Create a new calendar event for follow-ups, meetings, or deliveries.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCalendarEventInput) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select 
                  value={formData.event_type || 'Follow Up'} 
                  onValueChange={(value: EventType) => 
                    setFormData((prev: CreateCalendarEventInput) => ({ ...prev, event_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Follow Up">📞 Follow Up</SelectItem>
                    <SelectItem value="Meeting">👥 Meeting</SelectItem>
                    <SelectItem value="Call">☎️ Call</SelectItem>
                    <SelectItem value="Delivery">📦 Delivery</SelectItem>
                    <SelectItem value="Other">⚙️ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time.toISOString().slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCalendarEventInput) => ({ 
                        ...prev, 
                        start_time: new Date(e.target.value)
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time.toISOString().slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCalendarEventInput) => ({ 
                        ...prev, 
                        end_time: new Date(e.target.value)
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_id">Lead ID (Optional)</Label>
                  <Input
                    id="lead_id"
                    type="number"
                    value={formData.lead_id || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCalendarEventInput) => ({ 
                        ...prev, 
                        lead_id: e.target.value ? parseInt(e.target.value) : null
                      }))
                    }
                    placeholder="Enter lead ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_id">Order ID (Optional)</Label>
                  <Input
                    id="order_id"
                    type="number"
                    value={formData.order_id || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCalendarEventInput) => ({ 
                        ...prev, 
                        order_id: e.target.value ? parseInt(e.target.value) : null
                      }))
                    }
                    placeholder="Enter order ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCalendarEventInput) => ({ 
                      ...prev, 
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Event description or notes..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Schedule Event'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Today's Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{getTodayEvents().length}</div>
            <p className="text-xs text-blue-600 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{getUpcomingEvents().length}</div>
            <p className="text-xs text-purple-600 mt-1">Upcoming events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{events.length}</div>
            <p className="text-xs text-green-600 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Selector and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
            <CardDescription>Choose a date to view events</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              className="w-full"
            />
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="w-full"
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="w-full"
              >
                Tomorrow
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Events for {new Date(selectedDate).toLocaleDateString()}</span>
                <Badge variant="secondary">{filteredEvents.length}</Badge>
              </CardTitle>
              <CardDescription>
                All scheduled activities for the selected date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No events scheduled</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {events.length === 0 
                      ? "📅 Schedule your first event to get started" 
                      : "Select a different date or create a new event"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents
                    .sort((a, b) => a.start_time.getTime() - b.start_time.getTime())
                    .map((event: CalendarEvent) => {
                      const EventIcon = getEventTypeIcon(event.event_type);
                      return (
                        <Card key={event.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className={`p-2 rounded-lg ${getEventTypeColor(event.event_type)} border`}>
                                  <EventIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm">{event.title}</h3>
                                  {event.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {event.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                      - 
                                      {event.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {event.lead_id && (
                                      <span>Lead #{event.lead_id}</span>
                                    )}
                                    {event.order_id && (
                                      <span>Order #{event.order_id}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge className={getEventTypeColor(event.event_type)} variant="outline">
                                {event.event_type}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
