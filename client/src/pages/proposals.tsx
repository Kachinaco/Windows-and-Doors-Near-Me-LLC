import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, DollarSign, FileText, ExternalLink, Clock, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Proposal {
  id: number;
  leadId?: number;
  projectId?: number;
  title: string;
  description: string;
  totalAmount: number;
  status: string;
  fileUrl?: string;
  linkUrl?: string;
  validUntil?: string;
  sentAt?: string;
  respondedAt?: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdBy?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

const statusOptions = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" }
];

export default function ProposalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["/api/proposals"],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/proposals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Proposal created successfully",
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

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PUT", `/api/proposals/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Success",
        description: "Proposal updated successfully",
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

  const filteredProposals = Array.isArray(proposals) ? proposals.filter((proposal: Proposal) => {
    return statusFilter === "all" || proposal.status === statusFilter;
  }) : [];

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return (
      <Badge className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || status}
      </Badge>
    );
  };

  const handleCreateProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const validUntilDate = formData.get("validUntil") 
      ? new Date(formData.get("validUntil") as string).toISOString()
      : null;

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      totalAmount: parseFloat(formData.get("totalAmount") as string) || 0,
      leadId: formData.get("leadId") ? parseInt(formData.get("leadId") as string) : null,
      fileUrl: formData.get("fileUrl") || null,
      linkUrl: formData.get("linkUrl") || null,
      validUntil: validUntilDate,
    };

    createProposalMutation.mutate(data);
  };

  const handleStatusChange = (proposalId: number, newStatus: string) => {
    updateProposalMutation.mutate({
      id: proposalId,
      updates: { status: newStatus }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isValidUntilExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proposals</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage client proposals and track approval status</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Proposal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <Label htmlFor="title">Proposal Title</Label>
                <Input id="title" name="title" required />
              </div>

              <div>
                <Label htmlFor="leadId">Client</Label>
                <Select name="leadId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(leads) && leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.firstName} {lead.lastName} - {lead.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Total Amount ($)</Label>
                  <Input id="totalAmount" name="totalAmount" type="number" step="0.01" />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input id="validUntil" name="validUntil" type="date" />
                </div>
              </div>

              <div>
                <Label htmlFor="fileUrl">File URL (Optional)</Label>
                <Input id="fileUrl" name="fileUrl" type="url" placeholder="https://..." />
              </div>

              <div>
                <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://..." />
              </div>

              <Button type="submit" disabled={createProposalMutation.isPending}>
                {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProposals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredProposals.filter((p: Proposal) => p.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredProposals.filter((p: Proposal) => p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredProposals.reduce((sum: number, p: Proposal) => sum + p.totalAmount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No proposals found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create your first proposal to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProposals.map((proposal: Proposal) => (
            <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{proposal.title}</CardTitle>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(proposal.status)}
                    {proposal.validUntil && isValidUntilExpired(proposal.validUntil) && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {formatDate(proposal.createdAt)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {proposal.lead && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{proposal.lead.firstName} {proposal.lead.lastName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>${proposal.totalAmount.toLocaleString()}</span>
                  </div>

                  {proposal.validUntil && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Valid until {formatDate(proposal.validUntil)}</span>
                    </div>
                  )}

                  {proposal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {proposal.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    {proposal.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(proposal.fileUrl, '_blank')}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        File
                      </Button>
                    )}
                    {proposal.linkUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(proposal.linkUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Link
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-1 mt-4">
                    {statusOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={proposal.status === option.value ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleStatusChange(proposal.id, option.value)}
                        disabled={updateProposalMutation.isPending}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  {proposal.sentAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Sent: {formatDate(proposal.sentAt)}
                    </div>
                  )}

                  {proposal.respondedAt && (
                    <div className="text-xs text-gray-500">
                      Responded: {formatDate(proposal.respondedAt)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}