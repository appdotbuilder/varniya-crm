
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { DollarSign, Search, Calendar, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';
import type { Order } from '../../../server/src/schema';

export function ActiveDeals() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const loadActiveDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeDeals = await trpc.getActiveDeals.query();
      setOrders(activeDeals);
    } catch (error) {
      console.error('Failed to load active deals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveDeals();
  }, [loadActiveDeals]);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = !searchTerm || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getOrderStatusColor = (status: string) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-blue-100 text-blue-800',
      'In Production': 'bg-purple-100 text-purple-800',
      'Ready for Delivery': 'bg-orange-100 text-orange-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'Pending': 'bg-red-100 text-red-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'Refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getOrderIcon = (status: string) => {
    const icons = {
      'Pending': Clock,
      'Confirmed': CheckCircle,
      'In Production': Package,
      'Ready for Delivery': Calendar,
      'Delivered': CheckCircle,
      'Cancelled': AlertTriangle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const calculateProgress = (status: string) => {
    const statusProgress = {
      'Pending': 10,
      'Confirmed': 25,
      'In Production': 50,
      'Ready for Delivery': 80,
      'Delivered': 100,
      'Cancelled': 0
    };
    return statusProgress[status as keyof typeof statusProgress] || 0;
  };

  const getTotalRevenue = () => {
    return filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getPendingAmount = () => {
    return filteredOrders
      .filter(order => order.payment_status !== 'Paid')
      .reduce((sum, order) => sum + (order.balance_amount || order.total_amount), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Active Deals</h2>
          <p className="text-gray-600 mt-1">💎 Track converted leads and order progression</p>
        </div>
        <Button onClick={loadActiveDeals} variant="outline" size="sm">
          Refresh Deals
        </Button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹{getTotalRevenue().toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              From {filteredOrders.length} active deals
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Pending Payment</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">₹{getPendingAmount().toLocaleString()}</div>
            <p className="text-xs text-orange-600 mt-1">
              Outstanding amounts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{filteredOrders.length}</div>
            <p className="text-xs text-blue-600 mt-1">
              Deals in progress
            </p>
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
                placeholder="Search by order number or product details..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="In Production">In Production</SelectItem>
                <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Deals ({filteredOrders.length})</span>
            <div className="text-sm text-gray-600">
              Total Value: ₹{getTotalRevenue().toLocaleString()}
            </div>
          </CardTitle>
          <CardDescription>
            Monitor order progression and manage customer deliveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No active deals found</p>
              <p className="text-gray-400 text-sm mt-2">
                {orders.length === 0 
                  ? "🎯 Converted leads will appear here as active deals" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Details</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>SLA Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: Order) => {
                    const StatusIcon = getOrderIcon(order.order_status);
                    const progress = calculateProgress(order.order_status);
                    const isOverdue = order.delivery_date && new Date() > order.delivery_date && order.order_status !== 'Delivered';
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="h-4 w-4 text-gray-500" />
                              <p className="font-medium">{order.order_number}</p>
                            </div>
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {order.product_details}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created: {order.created_at.toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge className={getOrderStatusColor(order.order_status)}>
                              {order.order_status}
                            </Badge>
                            <div className="w-24">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">₹{order.total_amount.toLocaleString()}</p>
                            {order.advance_amount && (
                              <p className="text-xs text-gray-500">
                                Advance: ₹{order.advance_amount.toLocaleString()}
                              </p>
                            )}
                            {order.balance_amount && (
                              <p className="text-xs text-orange-600">
                                Balance: ₹{order.balance_amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.delivery_date && (
                              <p className="text-sm">
                                Due: {order.delivery_date.toLocaleDateString()}
                              </p>
                            )}
                            {order.actual_delivery_date && (
                              <p className="text-xs text-green-600">
                                Delivered: {order.actual_delivery_date.toLocaleDateString()}
                              </p>
                            )}
                            {isOverdue && (
                              <p className="text-xs text-red-600 flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.sla_breach ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Breached
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              On Track
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              Update
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
    </div>
  );
}
