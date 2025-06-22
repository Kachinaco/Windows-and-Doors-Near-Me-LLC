import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  Users,
  Calendar,
  Filter,
  Search,
  Download,
  Copy,
  Settings
} from "lucide-react";

interface Contract {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'cancelled';
  totalAmount: string;
  clientId: number;
  projectId: number;
  signedByClient: boolean;
  signedByContractor: boolean;
  sentAt: string | null;
  dueDate: string | null;
  createdAt: string;
  client?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  project?: {
    id: number;
    title: string;
  };
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-yellow-100 text-yellow-800",
  signed: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusIcons = {
  draft: Edit,
  sent: Send,
  viewed: Eye,
  signed: CheckCircle,
  completed: CheckCircle,
  cancelled: AlertCircle
};

export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: contractTemplates = [] } = useQuery({
    queryKey: ["/api/contract-templates"],
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Contract created successfully",
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

  const filteredContracts = contracts.filter((contract: Contract) => {
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus;
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.client?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusStats = () => {
    return {
      total: contracts.length,
      draft: contracts.filter((c: Contract) => c.status === 'draft').length,
      sent: contracts.filter((c: Contract) => c.status === 'sent').length,
      signed: contracts.filter((c: Contract) => c.status === 'signed').length,
      completed: contracts.filter((c: Contract) => c.status === 'completed').length,
    };
  };

  const stats = getStatusStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
                <p className="text-sm text-gray-500">Manage contracts and agreements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Contract
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Contract</DialogTitle>
                  </DialogHeader>
                  <ContractCreateForm
                    onSubmit={(data) => createContractMutation.mutate(data)}
                    projects={projects}
                    templates={contractTemplates}
                    isLoading={createContractMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Contracts</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.draft}</p>
                </div>
                <Edit className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Sent</p>
                  <p className="text-2xl font-bold text-yellow-800">{stats.sent}</p>
                </div>
                <Send className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Signed</p>
                  <p className="text-2xl font-bold text-green-800">{stats.signed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Completed</p>
                  <p className="text-2xl font-bold text-emerald-800">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContracts.map((contract: Contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filters"
                : "Create your first contract to get started"
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: Contract }) {
  const StatusIcon = statusIcons[contract.status];
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{contract.title}</h3>
            <p className="text-sm text-gray-600">{contract.project?.title}</p>
          </div>
          <Badge className={statusColors[contract.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {contract.client?.firstName} {contract.client?.lastName}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">${contract.totalAmount}</span>
          </div>
        </div>

        {contract.dueDate && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Due: {new Date(contract.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-2">
            {contract.signedByClient && (
              <Badge variant="secondary" className="text-xs">Client Signed</Badge>
            )}
            {contract.signedByContractor && (
              <Badge variant="secondary" className="text-xs">Contractor Signed</Badge>
            )}
          </div>
          
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractCreateForm({ 
  onSubmit, 
  projects, 
  templates, 
  isLoading 
}: { 
  onSubmit: (data: any) => void;
  projects: any[];
  templates: any[];
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    templateId: "",
    totalAmount: "",
    terms: "",
    dueDate: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Contract Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Window Installation Contract"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="projectId">Project</Label>
          <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="templateId">Template (Optional)</Label>
          <Select value={formData.templateId} onValueChange={(value) => setFormData({ ...formData, templateId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template: any) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            placeholder="5000.00"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the contract"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="terms">Contract Terms</Label>
        <Textarea
          id="terms"
          value={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          placeholder="Enter contract terms and conditions"
          rows={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Contract"}
        </Button>
      </div>
    </form>
  );
}