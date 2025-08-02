
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/utils/trpc';
import { Plus, Search, Phone, Mail, Calendar, Star, User, MessageSquare } from 'lucide-react';
import type { Lead, CreateLeadInput } from '../../../server/src/schema';

type LeadSource = 'WATI' | 'Google' | 'Meta' | 'SEO' | 'Organic' | 'Direct/Unknown';
type LeadMedium = 'WhatsApp' | 'Email' | 'Phone' | 'Website' | 'Social Media' | 'Direct';
type RequestType = 'Product enquiry' | 'Request for information' | 'Suggestions' | 'Other';
type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState<CreateLeadInput>({
    name: null,
    phone: null,
    email: null,
    lead_source: 'Direct/Unknown',
    lead_medium: 'Website',
    is_high_intent: false,
    request_type: 'Product enquiry',
    urgency_level: 'Medium',
    special_date: null,
    occasion: null,
    notes: null,
    assigned_to: null,
    wati_contact_id: null
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const leadsData = await trpc.getLeads.query();
      setLeads(leadsData);
    } catch (error) {
      console.error('Failed to load leads data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const newLead = await trpc.createLead.mutate(formData);
      setLeads((prev: Lead[]) => [newLead, ...prev]);
      setShowCreateDialog(false);
      setFormData({
        name: null,
        phone: null,
        email: null,
        lead_source: 'Direct/Unknown',
        lead_medium: 'Website',
        is_high_intent: false,
        request_type: 'Product enquiry',
        urgency_level: 'Medium',
        special_date: null,
        occasion: null,
        notes: null,
        assigned_to: null,
        wati_contact_id: null
      });
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter((lead: Lead) => {
    const matchesSearch = !searchTerm || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.pipeline_stage === stageFilter;
    const matchesSource = sourceFilter === 'all' || lead.lead_source === sourceFilter;
    
    return matchesSearch && matchesStage && matchesSource;
  });

  const getPipelineStageColor = (stage: string) => {
    const colors = {
      'Raw lead': 'bg-gray-100 text-gray-800',
      'In Contact': 'bg-blue-100 text-blue-800',
      'Not Interested': 'bg-red-100 text-red-800',
      'No Response': 'bg-yellow-100 text-yellow-800',
      'Junk': 'bg-gray-100 text-gray-600',
      'Genuine Lead': 'bg-green-100 text-green-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-3xl font-bold text-gray-900">Lead Management</h2>
          <p className="text-gray-600 mt-1">👥 Track and manage all your leads</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your CRM system with all relevant details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateLeadInput) => ({ ...prev, name: e.target.value || null }))
                    }
                    placeholder="Enter lead's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateLeadInput) => ({ ...prev, phone: e.target.value || null }))
                    }
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLeadInput) => ({ ...prev, email: e.target.value || null }))
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lead Source</Label>
                  <Select 
                    value={formData.lead_source || 'Direct/Unknown'} 
                    onValueChange={(value: LeadSource) => 
                      setFormData((prev: CreateLeadInput) => ({ ...prev, lead_source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WATI">💬 WATI</SelectItem>
                      <SelectItem value="Google">🔍 Google</SelectItem>
                      <SelectItem value="Meta">📘 Meta</SelectItem>
                      <SelectItem value="SEO">🎯 SEO</SelectItem>
                      <SelectItem value="Organic">🌱 Organic</SelectItem>
                      <SelectItem value="Direct/Unknown">🔗 Direct/Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lead Medium</Label>
                  <Select 
                    value={formData.lead_medium || 'Website'} 
                    onValueChange={(value: LeadMedium) => 
                      setFormData((prev: CreateLeadInput) => ({ ...prev, lead_medium: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Phone">Phone</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select 
                    value={formData.request_type || 'Product enquiry'} 
                    onValueChange={(value: RequestType) => 
                      setFormData((prev: CreateLeadInput) => ({ ...prev, request_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product enquiry">Product enquiry</SelectItem>
                      <SelectItem value="Request for information">Request for information</SelectItem>
                      <SelectItem value="Suggestions">Suggestions</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <Select 
                    value={formData.urgency_level || 'Medium'} 
                    onValueChange={(value: UrgencyLevel) => 
                      setFormData((prev: CreateLeadInput) => ({ ...prev, urgency_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">🟢 Low</SelectItem>
                      <SelectItem value="Medium">🟡 Medium</SelectItem>
                      <SelectItem value="High">🟠 High</SelectItem>
                      <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="special_date">Special Date</Label>
                  <Input
                    id="special_date"
                    type="date"
                    value={formData.special_date?.toISOString().split('T')[0] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateLeadInput) => ({ 
                        ...prev, 
                        special_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Input
                    id="occasion"
                    value={formData.occasion || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateLeadInput) => ({ ...prev, occasion: e.target.value || null }))
                    }
                    placeholder="Wedding, Anniversary, etc."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_high_intent || false}
                  onCheckedChange={(checked) =>
                    setFormData((prev: CreateLeadInput) => ({ ...prev, is_high_intent: checked }))
                  }
                />
                <Label>High Intent Lead</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateLeadInput) => ({ ...prev, notes: e.target.value || null }))
                  }
                  placeholder="Additional notes about the lead..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Lead'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search leads by name, phone, or email..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Raw lead">Raw lead</SelectItem>
                <SelectItem value="In Contact">In Contact</SelectItem>
                <SelectItem value="Not Interested">Not Interested</SelectItem>
                <SelectItem value="No Response">No Response</SelectItem>
                <SelectItem value="Junk">Junk</SelectItem>
                <SelectItem value="Genuine Lead">Genuine Lead</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="WATI">WATI</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Meta">Meta</SelectItem>
                <SelectItem value="SEO">SEO</SelectItem>
                <SelectItem value="Organic">Organic</SelectItem>
                <SelectItem value="Direct/Unknown">Direct/Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads ({filteredLeads.length})</span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage and track all your leads from various sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No leads found</p>
              <p className="text-gray-400 text-sm mt-2">
                {leads.length === 0 
                  ? "🚀 Create your first lead to get started!" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Info</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: Lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{lead.name || 'Anonymous'}</p>
                            {lead.is_high_intent && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            {lead.phone && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getLeadSourceIcon(lead.lead_source)}</span>
                          <div>
                            <p className="text-sm font-medium">{lead.lead_source}</p>
                            <p className="text-xs text-gray-500">{lead.lead_medium}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPipelineStageColor(lead.pipeline_stage)}>
                          {lead.pipeline_stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          lead.urgency_level === 'Urgent' ? 'destructive' :
                          lead.urgency_level === 'High' ? 'default' :
                          'secondary'
                        }>
                          {lead.urgency_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                            {lead.lead_score}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{lead.created_at.toLocaleDateString()}</p>
                          <p className="text-gray-500 text-xs">{lead.created_at.toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
