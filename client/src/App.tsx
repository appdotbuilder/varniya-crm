
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Calendar, Diamond, Activity, Eye, Phone, DollarSign } from 'lucide-react';

// Import all dashboard components
import { Dashboard } from './components/Dashboard';
import { LeadsManagement } from './components/LeadsManagement';
import { ActiveDeals } from './components/ActiveDeals';
import { PipelineView } from './components/PipelineView';
import { CalendarView } from './components/CalendarView';
import { DesignBank } from './components/DesignBank';
import { BrowsersView } from './components/BrowsersView';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, color: 'text-blue-600' },
    { id: 'leads', label: 'Leads', icon: Users, color: 'text-green-600' },
    { id: 'deals', label: 'Active Deals', icon: DollarSign, color: 'text-orange-600' },
    { id: 'pipeline', label: 'Pipeline', icon: Activity, color: 'text-purple-600' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'text-red-600' },
    { id: 'designs', label: 'Design Bank', icon: Diamond, color: 'text-pink-600' },
    { id: 'browsers', label: 'Browsers', icon: Eye, color: 'text-cyan-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg">
                <Diamond size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Varniya CRM</h1>
                <p className="text-sm text-gray-600">Diamond Sales Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Online
              </Badge>
              <Button variant="outline" size="sm">
                <Phone size={16} className="mr-2" />
                Quick Call
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white shadow-sm border border-gray-200 p-1 rounded-lg">
            {navigationItems.map((item) => (
              <TabsTrigger 
                key={item.id} 
                value={item.id}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
              >
                <item.icon size={16} className={activeTab === item.id ? 'text-white' : item.color} />
                <span className="hidden sm:inline">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <LeadsManagement />
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <ActiveDeals />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <PipelineView />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView />
          </TabsContent>

          <TabsContent value="designs" className="space-y-6">
            <DesignBank />
          </TabsContent>

          <TabsContent value="browsers" className="space-y-6">
            <BrowsersView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
