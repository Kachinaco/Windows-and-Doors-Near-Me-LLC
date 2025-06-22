import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  FileText, 
  Copy, 
  MoreVertical,
  User,
  FolderOpen,
  Plus,
  Edit3,
  Save,
  X,
  ExternalLink
} from "lucide-react";
import type { Lead } from "@shared/schema";

export default function LeadDetail() {
  const [, params] = useRoute("/leads/:id");
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = params?.id ? parseInt(params.id) : null;

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (updates: Partial<Lead>) => {
      const response = await apiRequest("PUT", `/api/leads/${leadId}`, updates);
      return await response.json();
    },
    onSuccess: (updatedLead) => {
      // Force a complete refetch instead of trying to update cache
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      // Small delay to ensure the invalidation takes effect
      setTimeout(() => {
        setIsEditing(false);
        setEditedLead({});
      }, 100);
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedLead({
      email: lead?.email || "",
      phone: lead?.phone || "",
      address: lead?.address || "",
      notes: lead?.notes || "",
      status: lead?.status || "new",
      source: lead?.source || "google",
    });
  };

  // Initialize edited lead when lead data changes
  useEffect(() => {
    if (lead && isEditing) {
      setEditedLead({
        email: lead.email || "",
        phone: lead.phone || "",
        address: lead.address || "",
        notes: lead.notes || "",
        status: lead.status || "new",
        source: lead.source || "google",
      });
    }
  }, [lead, isEditing]);

  const handleSave = () => {
    console.log("Save button clicked");
    console.log("Current editedLead state:", editedLead);
    console.log("Original lead data:", lead);
    
    // Filter out empty values and only include changed fields
    const updates = Object.entries(editedLead).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    console.log("Filtered updates to send:", updates);
    
    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes to save",
        variant: "destructive",
      });
      return;
    }
    
    updateLeadMutation.mutate(updates);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLead({});
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead not found</h2>
          <Button onClick={() => setLocation("/leads")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/leads")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              {lead.firstName} {lead.lastName}
            </h1>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-2 h-auto py-4 text-blue-600 hover:bg-blue-50"
            onClick={() => window.open(`tel:${lead.phone}`, '_self')}
          >
            <Phone className="w-6 h-6" />
            <span className="text-sm font-medium">Call</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-2 h-auto py-4 text-blue-600 hover:bg-blue-50"
            onClick={() => window.open(`mailto:${lead.email}`, '_self')}
          >
            <Mail className="w-6 h-6" />
            <span className="text-sm font-medium">Email</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-2 h-auto py-4 text-blue-600 hover:bg-blue-50"
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-medium">Text</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-2 h-auto py-4 text-blue-600 hover:bg-blue-50"
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-medium">New file</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="paylinks">Pay links</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="w-5 h-5" />
                    <span>Contact info</span>
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateLeadMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-2">
                    Email address
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedLead.email !== undefined ? String(editedLead.email || "") : String(lead?.email || "")}
                      onChange={(e) => setEditedLead(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full"
                      placeholder="Enter email address"
                    />
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-900">{lead.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(lead.email || "", "Email address")}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-2">
                    Phone number
                  </Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedLead.phone !== undefined ? String(editedLead.phone || "") : String(lead?.phone || "")}
                      onChange={(e) => setEditedLead(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-900">{lead.phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(lead.phone || "", "Phone number")}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-2">
                    Address
                  </Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editedLead.address !== undefined ? String(editedLead.address || "") : String(lead?.address || "")}
                      onChange={(e) => setEditedLead(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full"
                      placeholder="Enter address"
                    />
                  ) : lead.address ? (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-900">{lead.address}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(lead.address!, "Address")}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-500">
                      No address provided
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-2">
                    Notes
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editedLead.notes !== undefined ? String(editedLead.notes || "") : String(lead?.notes || "")}
                      onChange={(e) => setEditedLead(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full"
                      placeholder="Enter notes"
                      rows={3}
                    />
                  ) : lead.notes ? (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-900">{lead.notes}</span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-500">
                      No notes available
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-2">
                    Status
                  </Label>
                  {isEditing ? (
                    <Select
                      value={editedLead.status || (lead.status ?? "new")}
                      onValueChange={(value) => setEditedLead(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        lead.status === 'new' ? 'bg-blue-500' :
                        lead.status === 'contacted' ? 'bg-yellow-500' :
                        lead.status === 'qualified' ? 'bg-green-500' :
                        lead.status === 'proposal_sent' ? 'bg-purple-500' :
                        lead.status === 'closed_won' ? 'bg-emerald-500' :
                        'bg-red-500'
                      }`}></div>
                      <Badge 
                        variant={lead.status === 'new' ? 'default' : 
                                lead.status === 'contacted' ? 'secondary' :
                                lead.status === 'qualified' ? 'outline' : 'destructive'}
                        className="capitalize font-medium"
                      >
                        {lead.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-2">
                    Source
                  </Label>
                  {isEditing ? (
                    <Select
                      value={editedLead.source || (lead?.source ?? "google")}
                      onValueChange={(value) => setEditedLead(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="customer_referral">Customer Referral</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="yelp">Yelp</SelectItem>
                        <SelectItem value="thumbtack">Thumbtack</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        lead.source === 'google' ? 'bg-blue-500' :
                        lead.source === 'yelp' ? 'bg-red-500' :
                        lead.source === 'thumbtack' ? 'bg-green-500' :
                        lead.source === 'phone' ? 'bg-purple-500' :
                        lead.source === 'customer_referral' ? 'bg-orange-500' :
                        lead.source === 'online' ? 'bg-teal-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-gray-900 capitalize font-medium">
                        {lead.source === 'customer_referral' ? 'Customer Referral' : 
                         lead.source?.replace('_', ' ') || lead.source}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>



            {/* Related Projects */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5" />
                    <span>Related projects</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">ACTIVE: 1</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div className="text-sm text-gray-600">Planning</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No communication history yet</p>
                <p className="text-sm mt-1">Communications will appear here once you start connecting with this lead</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paylinks" className="space-y-6">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <ExternalLink className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No payment links yet</p>
                <p className="text-sm mt-1">Create payment links to collect payments from this lead</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}