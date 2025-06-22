import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  FileText, 
  ExternalLink, 
  Copy, 
  MoreVertical,
  User,
  Building,
  FolderOpen,
  Plus
} from "lucide-react";
import type { Lead } from "@shared/schema";

export default function LeadDetail() {
  const [, params] = useRoute("/leads/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = params?.id ? parseInt(params.id) : null;

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
  });

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
            <span className="text-sm font-medium">New file</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-2 h-auto py-4 text-blue-600 hover:bg-blue-50"
          >
            <ExternalLink className="w-6 h-6" />
            <span className="text-sm font-medium">Pay link</span>
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
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="w-5 h-5" />
                  <span>Contact info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Email address
                  </label>
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
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Phone number
                  </label>
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
                </div>

                {lead.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      Address
                    </label>
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
                  </div>
                )}

                {lead.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      Notes
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-900">{lead.notes}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Status
                  </label>
                  <Badge 
                    variant={lead.status === 'new' ? 'default' : 
                            lead.status === 'contacted' ? 'secondary' :
                            lead.status === 'qualified' ? 'outline' : 'destructive'}
                    className="capitalize"
                  >
                    {lead.status}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Source
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-900 capitalize">{lead.source}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Organizations */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Building className="w-5 h-5" />
                  <span>Related organizations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>There are no related organizations yet</p>
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