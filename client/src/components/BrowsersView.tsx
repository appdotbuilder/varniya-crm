
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Eye, Search, TrendingUp, ShoppingCart, Mouse, Smartphone, AlertTriangle, MessageSquare } from 'lucide-react';
import type { BrowserActivity } from '../../../server/src/schema';

export function BrowsersView() {
  const [browserActivities, setBrowserActivities] = useState<BrowserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');

  const loadBrowserActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const activitiesData = await trpc.getBrowserActivities.query();
      setBrowserActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load browser activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrowserActivities();
  }, [loadBrowserActivities]);

  // Filter activities based on search and filters
  const filteredActivities = browserActivities.filter((activity: BrowserActivity) => {
    const matchesSearch = !searchTerm || 
      activity.phone?.includes(searchTerm) ||
      activity.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.session_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActivity = activityFilter === 'all' || activity.activity_type === activityFilter;
    
    const matchesIntent = 
      intentFilter === 'all' ||
      (intentFilter === 'high' && activity.intent_score >= 7) ||
      (intentFilter === 'medium' && activity.intent_score >= 4 && activity.intent_score < 7) ||
      (intentFilter === 'low' && activity.intent_score < 4);
    
    return matchesSearch && matchesActivity && matchesIntent;
  });

  const getActivityTypeColor = (type: string) => {
    const colors = {
      'Add to Cart': 'bg-red-100 text-red-800 border-red-200',
      'Browsed multiple Products': 'bg-blue-100 text-blue-800 border-blue-200',
      'Multiple website visits': 'bg-purple-100 text-purple-800 border-purple-200',
      'Product View': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'Add to Cart': ShoppingCart,
      'Browsed multiple Products': Eye,
      'Multiple website visits': Mouse,
      'Product View': Smartphone
    };
    return icons[type as keyof typeof icons] || Eye;
  };

  const getIntentColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50';
    if (score >= 6) return 'text-orange-600 bg-orange-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getIntentLabel = (score: number) => {
    if (score >= 8) return 'Very High';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getHighIntentActivities = () => {
    return browserActivities.filter(activity => activity.intent_score >= 7);
  };

  const getTotalSessions = () => {
    return new Set(browserActivities.map(activity => activity.session_id)).size;
  };

  const getAverageIntentScore = () => {
    if (browserActivities.length === 0) return 0;
    const totalScore = browserActivities.reduce((sum, activity) => sum + activity.intent_score, 0);
    return totalScore / browserActivities.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Browsers</h2>
          <p className="text-gray-600 mt-1">🔍 Nitro Analytics - Track high-intent website visitors</p>
        </div>
        <Button onClick={loadBrowserActivities} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">{browserActivities.length}</div>
            <p className="text-xs text-cyan-600 mt-1">Tracked interactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Unique Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{getTotalSessions()}</div>
            <p className="text-xs text-purple-600 mt-1">Unique visitors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">High Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{getHighIntentActivities().length}</div>
            <p className="text-xs text-red-600 mt-1">Score ≥ 7</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Avg Intent Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{getAverageIntentScore().toFixed(1)}</div>
            <Progress value={(getAverageIntentScore() / 10) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by phone, email, or session ID..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="Add to Cart">Add to Cart</SelectItem>
                <SelectItem value="Browsed multiple Products">Browsed Products</SelectItem>
                <SelectItem value="Multiple website visits">Multiple Visits</SelectItem>
                <SelectItem value="Product View">Product View</SelectItem>
              </SelectContent>
            </Select>
            <Select value={intentFilter} onValueChange={setIntentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intent Levels</SelectItem>
                <SelectItem value="high">High Intent (7+)</SelectItem>
                <SelectItem value="medium">Medium Intent (4-6)</SelectItem>
                <SelectItem value="low">Low Intent (0-3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* High Intent Alert */}
      {getHighIntentActivities().length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  🚨 {getHighIntentActivities().length} High Intent Visitors Detected!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  These visitors show strong purchase intent. Consider immediate follow-up via WhatsApp or phone.
                </p>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Auto Messages
              </Button>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Convert to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Browser Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Browser Activities ({filteredActivities.length})</span>
            <div className="text-sm text-gray-600">
              Nitro Analytics Integration
            </div>
          </CardTitle>
          <CardDescription>
            Real-time tracking of website visitor behavior and purchase intent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No browser activities found</p>
              <p className="text-gray-400 text-sm mt-2">
                {browserActivities.length === 0 
                  ? "📊 Browser activity data will appear here from Nitro Analytics integration" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor Info</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Intent Score</TableHead>
                    <TableHead>Activity Count</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity: BrowserActivity) => {
                    const ActivityIcon = getActivityIcon(activity.activity_type);
                    const isHighIntent = activity.intent_score >= 7;
                    
                    return (
                      <TableRow key={activity.id} className={isHighIntent ? 'bg-red-50 border-red-100' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium">
                                {activity.phone || activity.email || 'Anonymous'}
                              </div>
                              {isHighIntent && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            {activity.phone && activity.email && (
                              <p className="text-xs text-gray-500">{activity.email}</p>
                            )}
                            {activity.user_id && (
                              <p className="text-xs text-gray-500">User ID: {activity.user_id}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${getActivityTypeColor(activity.activity_type)} border`}>
                              <ActivityIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.activity_type}</p>
                              {activity.product_data && (
                                <p className="text-xs text-gray-500 max-w-xs truncate">
                                  {activity.product_data}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getIntentColor(activity.intent_score)}`}>
                              {activity.intent_score}/10
                            </div>
                            <Badge variant={isHighIntent ? 'destructive' : 'secondary'} className="text-xs">
                              {getIntentLabel(activity.intent_score)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{activity.activity_count}</div>
                            <p className="text-xs text-gray-500">interactions</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">
                              First: {activity.first_activity_at.toLocaleDateString()}
                            </p>
                            <p className="text-gray-500">
                              Last: {activity.last_activity_at.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {activity.last_activity_at.toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {activity.session_id.substring(0, 8)}...
                            </p>
                            <p className="text-gray-500 mt-1">
                              Created: {activity.created_at.toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {isHighIntent && (
                              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                🔗 Nitro Analytics Integration Status
              </p>
              <p className="text-xs text-blue-700 mt-1">
                This tab displays browser activity data from your Nitro Analytics platform. 
                High-intent users are automatically flagged for immediate follow-up and can be converted to leads with a single click.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
