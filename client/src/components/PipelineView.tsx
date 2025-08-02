
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Users, TrendingUp, ArrowRight, Star, Calendar, Phone } from 'lucide-react';
import type { Lead } from '../../../server/src/schema';

interface PipelineStage {
  name: string;
  color: string;
  bgColor: string;
  leads: Lead[];
  icon: React.ElementType;
}

export function PipelineView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPipelineData = useCallback(async () => {
    try {
      setIsLoading(true);
      const leadsData = await trpc.getLeads.query();
      setLeads(leadsData);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  // Group leads by pipeline stage
  const pipelineStages: PipelineStage[] = [
    {
      name: 'Raw lead',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      leads: leads.filter(lead => lead.pipeline_stage === 'Raw lead'),
      icon: Users
    },
    {
      name: 'In Contact',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      leads: leads.filter(lead => lead.pipeline_stage === 'In Contact'),
      icon: Phone
    },
    {
      name: 'Genuine Lead',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      leads: leads.filter(lead => lead.pipeline_stage === 'Genuine Lead'),
      icon: Star
    },
    {
      name: 'Not Interested',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      leads: leads.filter(lead => lead.pipeline_stage === 'Not Interested'),
      icon: TrendingUp
    },
    {
      name: 'No Response',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      leads: leads.filter(lead => lead.pipeline_stage === 'No Response'),
      icon: Calendar
    }
  ];

  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? (pipelineStages[2].leads.length / totalLeads) * 100 : 0;

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLeadSourceIcon = (source: string) => {
    const icons = {
      'WATI': '💬',
      'Google': '🔍',
      'Meta': '📘',
      'SEO': '🎯',
      'Organic': '🌱',
      'Direct/Unknown': '🔗'
    };
    return icons[source as keyof typeof icons] || '🔗';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pipeline View</h2>
          <p className="text-gray-600 mt-1">📊 Visualize lead progression through stages</p>
        </div>
        <Button onClick={loadPipelineData} variant="outline" size="sm">
          Refresh Pipeline
        </Button>
      </div>

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalLeads}</div>
            <p className="text-xs text-blue-600 mt-1">In pipeline</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{conversionRate.toFixed(1)}%</div>
            <Progress value={conversionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">High Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {leads.filter(lead => lead.is_high_intent).length}
            </div>
            <p className="text-xs text-orange-600 mt-1">Priority leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {pipelineStages.map((stage, index) => {
            const StageIcon = stage.icon;
            return (
              <Card key={stage.name} className={`${stage.bgColor} relative`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm font-semibold ${stage.color} flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                      <StageIcon className="h-4 w-4" />
                      <span>{stage.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stage.leads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {stage.leads.length === 0 ? (
                    <div className="text-center py-8">
                      <StageIcon className={`h-8 w-8 mx-auto mb-2 ${stage.color} opacity-50`} />
                      <p className="text-xs text-gray-500">No leads in this stage</p>
                    </div>
                  ) : (
                    stage.leads.map((lead: Lead) => (
                      <Card key={lead.id} className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate flex-1">
                                {lead.name || 'Anonymous Lead'}
                              </h4>
                              {lead.is_high_intent && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center space-x-1">
                                <span>{getLeadSourceIcon(lead.lead_source)}</span>
                                <span className="text-gray-600">{lead.lead_source}</span>
                              </span>
                              <Badge className={getUrgencyColor(lead.urgency_level)} variant="secondary">
                                {lead.urgency_level}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              {lead.phone && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {lead.phone}
                                </p>
                              )}
                              {lead.email && (
                                <p className="text-xs text-gray-600 truncate">
                                  {lead.email}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Score: {lead.lead_score}</span>
                              <span>{lead.created_at.toLocaleDateString()}</span>
                            </div>

                            {lead.notes && (
                              <p className="text-xs text-gray-600 line-clamp-2 mt-2">
                                {lead.notes}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
                
                {/* Stage separator arrow */}
                {index < pipelineStages.length - 1 && (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="bg-white rounded-full p-1 shadow-md border">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pipeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Summary</CardTitle>
          <CardDescription>Overview of lead distribution and progression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineStages.map((stage) => {
              const percentage = totalLeads > 0 ? (stage.leads.length / totalLeads) * 100 : 0;
              return (
                <div key={stage.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${stage.color.replace('text-', 'bg-')}`}></div>
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {stage.leads.length}
                    </span>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {leads.length === 0 && !isLoading && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No leads in pipeline</p>
              <p className="text-gray-400 text-sm mt-2">
                📈 Start by adding leads to see your pipeline visualization
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
