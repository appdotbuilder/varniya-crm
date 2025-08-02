
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
import { Diamond, Plus, Search, Filter, Eye, Heart, Share, Tag } from 'lucide-react';
import type { Design, CreateDesignInput } from '../../../server/src/schema';

export function DesignBank() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState<CreateDesignInput>({
    name: '',
    category: '',
    subcategory: null,
    image_url: '',
    description: null,
    price_range_min: null,
    price_range_max: null,
    tags: null
  });

  const loadDesigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const designsData = await trpc.getDesigns.query();
      setDesigns(designsData);
    } catch (error) {
      console.error('Failed to load designs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  const handleCreateDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const newDesign = await trpc.createDesign.mutate(formData);
      setDesigns((prev: Design[]) => [newDesign, ...prev]);
      setShowCreateDialog(false);
      setFormData({
        name: '',
        category: '',
        subcategory: null,
        image_url: '',
        description: null,
        price_range_min: null,
        price_range_max: null,
        tags: null
      });
    } catch (error) {
      console.error('Failed to create design:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter designs based on search and category
  const filteredDesigns = designs.filter((design: Design) => {
    const matchesSearch = !searchTerm || 
      design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || design.category === categoryFilter;
    
    return matchesSearch && matchesCategory && design.is_active;
  });

  // Get unique categories from designs
  const categories = [...new Set(designs.map(design => design.category))];

  const formatPriceRange = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Price on request';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return 'Price on request';
  };

  const parseTags = (tagsString: string | null): string[] => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return tagsString.split(',').map(tag => tag.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Design Bank</h2>
          <p className="text-gray-600 mt-1">💎 Browse and manage diamond designs</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Design
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Design</DialogTitle>
              <DialogDescription>
                Add a new diamond design to your collection.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDesign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Design Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDesignInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter design name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDesignInput) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="Ring, Necklace, Earrings, etc."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateDesignInput) => ({ ...prev, subcategory: e.target.value || null }))
                  }
                  placeholder="Engagement Ring, Tennis Necklace, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateDesignInput) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://example.com/design-image.jpg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_min">Min Price (₹)</Label>
                  <Input
                    id="price_min"
                    type="number"
                    value={formData.price_range_min || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDesignInput) => ({ 
                        ...prev, 
                        price_range_min: e.target.value ? parseInt(e.target.value) : null
                      }))
                    }
                    placeholder="Minimum price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_max">Max Price (₹)</Label>
                  <Input
                    id="price_max"
                    type="number"
                    value={formData.price_range_max || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDesignInput) => ({ 
                        ...prev, 
                        price_range_max: e.target.value ? parseInt(e.target.value) : null
                      }))
                    }
                    placeholder="Maximum price"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateDesignInput) => ({ 
                      ...prev, 
                      tags: e.target.value || null
                    }))
                  }
                  placeholder="modern, classic, vintage, elegant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateDesignInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Describe the design, materials, craftsmanship..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Design'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search designs by name, description, or tags..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Design Collection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-700">Total Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900">{designs.filter(d => d.is_active).length}</div>
            <p className="text-xs text-pink-600 mt-1">Active designs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{categories.length}</div>
            <p className="text-xs text-purple-600 mt-1">Different categories</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Premium Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {designs.filter(d => d.price_range_min && d.price_range_min > 100000).length}
            </div>
            <p className="text-xs text-blue-600 mt-1">Above ₹1 Lakh</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Filtered Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{filteredDesigns.length}</div>
            <p className="text-xs text-green-600 mt-1">Matching criteria</p>
          </CardContent>
        </Card>
      </div>

      {/* Design Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Design Collection ({filteredDesigns.length})</span>
            <Button variant="outline" size="sm" onClick={loadDesigns}>
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Browse and manage your diamond design collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <Diamond className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No designs found</p>
              <p className="text-gray-400 text-sm mt-2">
                {designs.length === 0 
                  ? "✨ Add your first design to build your collection" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigns.map((design: Design) => (
                <Card key={design.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative">
                    <img
                      src={design.image_url}
                      alt={design.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop&auto=format`;
                      }}
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm line-clamp-1">{design.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {design.category}
                        </Badge>
                      </div>
                      
                      {design.subcategory && (
                        <p className="text-xs text-gray-600">{design.subcategory}</p>
                      )}

                      <p className="text-sm font-medium text-blue-600">
                        {formatPriceRange(design.price_range_min, design.price_range_max)}
                      </p>

                      {design.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {design.description}
                        </p>
                      )}

                      {design.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {parseTags(design.tags).slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {parseTags(design.tags).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{parseTags(design.tags).length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                        <span>Added: {design.created_at.toLocaleDateString()}</span>
                        <span>ID: {design.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
