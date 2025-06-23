import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Eye, FileText, CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Proposal {
  id: number;
  title: string;
  status: string;
  clientName: string;
  clientEmail: string;
  projectAddress: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  paidAt?: string;
  createdAt: string;
  projectId: number;
  invoice?: any;
  contract?: any;
  payment?: any;
}

interface Project {
  id: number;
  name: string;
  clientName: string;
  clientEmail: string;
  projectAddress: string;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Send },
  viewed: { label: "Viewed", color: "bg-yellow-100 text-yellow-800", icon: Eye },
  signed: { label: "Signed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  paid: { label: "Paid", color: "bg-purple-100 text-purple-800", icon: CreditCard },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
};

export default function ProposalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [proposalTitle, setProposalTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch proposals
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['/api/proposals'],
    queryFn: () => apiRequest('GET', '/api/proposals').then(res => res.json())
  });

  // Fetch projects for proposal creation
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects').then(res => res.json())
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/proposals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      setIsCreateDialogOpen(false);
      setSelectedProjectId("");
      setProposalTitle("");
      toast({
        title: "Proposal Created",
        description: "Your proposal has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send proposal mutation
  const sendProposalMutation = useMutation({
    mutationFn: (proposalId: number) => apiRequest('POST', `/api/proposals/${proposalId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Proposal Sent",
        description: "The proposal has been sent to the client.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProposal = () => {
    if (!selectedProjectId || !proposalTitle) {
      toast({
        title: "Missing Information",
        description: "Please select a project and enter a proposal title.",
        variant: "destructive",
      });
      return;
    }

    const selectedProject = projects.find(p => p.id === parseInt(selectedProjectId));
    if (!selectedProject) return;

    createProposalMutation.mutate({
      projectId: parseInt(selectedProjectId),
      title: proposalTitle,
      clientName: selectedProject.clientName || selectedProject.name,
      clientEmail: selectedProject.clientEmail || "",
      clientPhone: selectedProject.clientPhone || "",
      projectAddress: selectedProject.projectAddress || "",
    });
  };

  const handleSendProposal = (proposalId: number) => {
    sendProposalMutation.mutate(proposalId);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">Create and manage client proposals</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Proposal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Select Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name} - {project.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="Enter proposal title"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProposal}
                  disabled={createProposalMutation.isPending}
                >
                  {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {proposals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-4">Create your first proposal to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal: Proposal) => (
            <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {proposal.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{proposal.clientName}</p>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{formatDate(proposal.createdAt)}</span>
                  </div>
                  {proposal.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sent:</span>
                      <span>{formatDate(proposal.sentAt)}</span>
                    </div>
                  )}
                  {proposal.viewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Viewed:</span>
                      <span>{formatDate(proposal.viewedAt)}</span>
                    </div>
                  )}
                  {proposal.signedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signed:</span>
                      <span>{formatDate(proposal.signedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`/proposal/${proposal.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  {proposal.status === 'draft' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSendProposal(proposal.id)}
                      disabled={sendProposalMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {sendProposalMutation.isPending ? "Sending..." : "Send"}
                    </Button>
                  )}
                  
                  {proposal.status !== 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(`/proposal/${proposal.id}/client-view`, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Client View
                    </Button>
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