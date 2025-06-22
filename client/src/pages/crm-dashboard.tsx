import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  TrendingUp, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CRMDashboard() {
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Fetch comprehensive CRM analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/crm/analytics', selectedTimeRange],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedTimeRange));
      
      return apiRequest('GET', `/api/crm/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    }
  });

  // Fetch leads for customer selection
  const { data: leads } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: () => apiRequest('GET', '/api/leads')
  });

  // Fetch customer 360 view when customer is selected
  const { data: customer360, isLoading: customer360Loading } = useQuery({
    queryKey: ['/api/crm/customer360', selectedCustomer],
    queryFn: () => selectedCustomer ? apiRequest('GET', `/api/crm/customer360/${selectedCustomer}`) : null,
    enabled: !!selectedCustomer
  });

  // CRM Health Check
  const { data: healthCheck } = useQuery({
    queryKey: ['/api/crm/health-check'],
    queryFn: () => apiRequest('GET', '/api/crm/health-check')
  });

  // Bulk sync mutation
  const bulkSyncMutation = useMutation({
    mutationFn: (syncType: string) => apiRequest('POST', '/api/crm/bulk-sync', { syncType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/health-check'] });
    }
  });

  // Convert lead to project mutation
  const convertLeadMutation = useMutation({
    mutationFn: ({ leadId, projectData }: { leadId: number, projectData: any }) => 
      apiRequest('POST', '/api/crm/convert-lead-to-project', { leadId, projectData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/analytics'] });
    }
  });

  if (analyticsLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const leadConversionData = analytics?.pipeline?.map(stage => ({
    name: stage.stage.replace('_', ' ').toUpperCase(),
    count: stage.count,
    value: parseFloat(stage.value || '0'),
    conversionRate: parseFloat(stage.conversionRate || '0')
  })) || [];

  const communicationBreakdown = [
    { name: 'Calls', value: analytics?.communications?.calls || 0, color: '#0088FE' },
    { name: 'Emails', value: analytics?.communications?.emails || 0, color: '#00C49F' },
    { name: 'SMS', value: analytics?.communications?.sms || 0, color: '#FFBB28' }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-gray-600">Comprehensive view of leads, projects, analytics, and communications</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => bulkSyncMutation.mutate('all')}
            disabled={bulkSyncMutation.isPending}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${bulkSyncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync All Data
          </Button>
        </div>
      </div>

      {/* System Health */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{healthCheck.totalLeads}</div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{healthCheck.totalProjects}</div>
                <div className="text-sm text-gray-600">Active Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{healthCheck.totalJobs}</div>
                <div className="text-sm text-gray-600">Scheduled Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{healthCheck.totalCommunications}</div>
                <div className="text-sm text-gray-600">Communications</div>
              </div>
              <div className="text-center">
                <Badge variant={healthCheck.dataIntegrity === 'OK' ? 'default' : 'destructive'}>
                  {healthCheck.dataIntegrity}
                </Badge>
                <div className="text-sm text-gray-600">Data Integrity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics?.summary?.conversionRate || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+2.3% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                <p className="text-2xl font-bold">${analytics?.summary?.avgDealSize || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+8.1% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${analytics?.summary?.totalRevenue || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Call Duration</p>
                <p className="text-2xl font-bold">{Math.round(analytics?.communications?.avgDuration / 60 || 0)}m</p>
              </div>
              <Phone className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600">-1.2% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="customer360">Customer 360</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Conversion Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadConversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Communication Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={communicationBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {communicationBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadConversionData.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`h-3 w-3 rounded-full bg-blue-500`}></div>
                      <div>
                        <div className="font-medium">{stage.name}</div>
                        <div className="text-sm text-gray-600">{stage.count} projects</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${stage.value.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{stage.conversionRate}% conversion</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{analytics?.communications?.calls || 0}</div>
                <div className="text-sm text-gray-600">Total Calls</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{analytics?.communications?.emails || 0}</div>
                <div className="text-sm text-gray-600">Emails Sent</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{analytics?.communications?.sms || 0}</div>
                <div className="text-sm text-gray-600">SMS Messages</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customer360" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <Select value={selectedCustomer || ''} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {leads?.map((lead: any) => (
                  <SelectItem key={lead.id} value={lead.id.toString()}>
                    {lead.firstName} {lead.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customer360Loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading customer data...</p>
            </div>
          )}

          {customer360 && !customer360Loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Info */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Customer Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{customer360.customer?.firstName} {customer360.customer?.lastName}</p>
                    <p className="text-sm text-gray-600">{customer360.customer?.email}</p>
                    <p className="text-sm text-gray-600">{customer360.customer?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Source</p>
                    <Badge variant="secondary">{customer360.customer?.source}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={customer360.customer?.status === 'won' ? 'default' : 'secondary'}>
                      {customer360.customer?.status}
                    </Badge>
                  </div>
                  {customer360.metrics && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Metrics</p>
                      <div className="text-sm">
                        <p>Communications: {customer360.metrics.communicationCount}</p>
                        <p>Proposals: {customer360.metrics.proposalsSent}</p>
                        {customer360.metrics.timeToConversion && (
                          <p>Time to conversion: {customer360.metrics.timeToConversion} days</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Customer Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {customer360.timeline?.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {item.type === 'call' && <Phone className="h-4 w-4 text-blue-500" />}
                          {item.type === 'email' && <Mail className="h-4 w-4 text-green-500" />}
                          {item.type === 'project_update' && <FileText className="h-4 w-4 text-purple-500" />}
                          {item.type === 'project_conversion' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.subject || item.type}</p>
                          <p className="text-sm text-gray-600">{item.description || item.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}