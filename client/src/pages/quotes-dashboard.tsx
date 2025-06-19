import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface QuoteRequest {
  id: number;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectAddress?: string;
  items: any[];
  totalEstimate: string;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  assignedTo?: number;
  activities?: QuoteActivity[];
}

interface QuoteActivity {
  id: number;
  activityType: string;
  description: string;
  createdAt: string;
  performedBy?: number;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800", 
  quoted: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800"
};

const priorityColors = {
  normal: "bg-gray-100 text-gray-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function QuotesDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [newActivity, setNewActivity] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quote requests
  const { data: quoteRequests = [], isLoading } = useQuery<QuoteRequest[]>({
    queryKey: ["/api/quote-requests", selectedStatus !== "all" ? { status: selectedStatus } : {}],
    retry: false,
  });

  // Update quote status mutation
  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/quote-requests/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
      toast({
        title: "Quote Updated",
        description: "Quote request has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update quote request.",
        variant: "destructive",
      });
    },
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async ({ quoteId, activity }: { quoteId: number; activity: any }) => {
      const response = await apiRequest("POST", `/api/quote-requests/${quoteId}/activities`, activity);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
      setNewActivity("");
      toast({
        title: "Activity Added",
        description: "Activity has been recorded successfully.",
      });
    },
  });

  const handleStatusChange = (quoteId: number, newStatus: string) => {
    updateQuoteMutation.mutate({
      id: quoteId,
      updates: { status: newStatus }
    });
  };

  const handleAddActivity = (quoteId: number) => {
    if (!newActivity.trim()) return;
    
    addActivityMutation.mutate({
      quoteId,
      activity: {
        activityType: "note",
        description: newActivity,
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "reviewed": return <AlertCircle className="h-4 w-4" />;
      case "quoted": return <FileText className="h-4 w-4" />;
      case "converted": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quote Requests Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage customer quote requests and track sales pipeline
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quotes</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quote Requests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {(quoteRequests as QuoteRequest[]).map((quote: QuoteRequest) => (
            <Card key={quote.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {quote.quoteNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
                      {getStatusIcon(quote.status)}
                      <span className="ml-1 capitalize">{quote.status}</span>
                    </Badge>
                    {quote.priority !== "normal" && (
                      <Badge className={priorityColors[quote.priority as keyof typeof priorityColors]}>
                        {quote.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">{quote.customerName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{quote.customerPhone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{quote.customerEmail}</span>
                  </div>
                  {quote.projectAddress && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate">{quote.projectAddress}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Estimate:</span>
                    <span className="text-lg font-bold text-green-600">
                      ${parseInt(quote.totalEstimate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Items:</span>
                    <span className="text-sm">{quote.items.length} windows</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={quote.status}
                    onValueChange={(value) => handleStatusChange(quote.id, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Quote Details - {quote.quoteNumber}</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Customer Info */}
                        <div>
                          <h3 className="font-semibold mb-2">Customer Information</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label>Name</Label>
                              <p>{quote.customerName}</p>
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <p>{quote.customerPhone}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p>{quote.customerEmail}</p>
                            </div>
                            <div>
                              <Label>Address</Label>
                              <p>{quote.projectAddress || "Not provided"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div>
                          <h3 className="font-semibold mb-2">Quote Items ({quote.items.length})</h3>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {quote.items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div>
                                  <p className="font-medium text-sm">{item.productType}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.width}" x {item.height}" (Qty: {item.quantity})
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">${item.totalPrice.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t flex justify-between font-bold">
                            <span>Total:</span>
                            <span>${parseInt(quote.totalEstimate).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {quote.notes && (
                          <div>
                            <h3 className="font-semibold mb-2">Customer Notes</h3>
                            <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              {quote.notes}
                            </p>
                          </div>
                        )}

                        {/* Add Activity */}
                        <div>
                          <h3 className="font-semibold mb-2">Add Activity</h3>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add a note or activity..."
                              value={newActivity}
                              onChange={(e) => setNewActivity(e.target.value)}
                              rows={2}
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => handleAddActivity(quote.id)}
                              disabled={!newActivity.trim() || addActivityMutation.isPending}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button 
                            onClick={() => window.open(`tel:${quote.customerPhone}`)}
                            variant="outline"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Customer
                          </Button>
                          <Button 
                            onClick={() => window.open(`mailto:${quote.customerEmail}`)}
                            variant="outline"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email Customer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(quoteRequests as QuoteRequest[]).length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Quote Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedStatus === "all" 
                ? "No quote requests have been submitted yet." 
                : `No quote requests with status "${selectedStatus}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}