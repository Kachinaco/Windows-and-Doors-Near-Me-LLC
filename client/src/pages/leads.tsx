import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  LogOut,
  User,
  Settings,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  UserPlus
} from "lucide-react";
import { Link } from "wouter";

export default function LeadsPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<ContactSubmission | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const { data: contactSubmissions = [], isLoading } = useQuery<ContactSubmission[]>({
    queryKey: ["/api/contact-submissions"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/contact-submissions/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions"] });
      setIsStatusDialogOpen(false);
      setSelectedLead(null);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "converted":
        return "bg-green-500";
      case "contacted":
        return "bg-blue-500";
      case "new":
        return "bg-yellow-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (selectedLead) {
      updateStatusMutation.mutate({ id: selectedLead.id, status });
    }
  };

  const handleConvertToProject = (lead: ContactSubmission) => {
    // This would typically open a dialog to create a project from the lead
    console.log("Converting lead to project:", lead);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Lead Management
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </span>
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Lead Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage contact form submissions and convert leads to projects
          </p>
        </div>

        {/* Leads List */}
        <div className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">Loading leads...</p>
              </CardContent>
            </Card>
          ) : contactSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Leads Yet</h3>
                  <p className="text-gray-500 mb-4">Contact form submissions will appear here</p>
                  <p className="text-sm text-gray-400">
                    Customers can submit inquiries through the contact form on your website
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            contactSubmissions.map((submission: ContactSubmission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{submission.firstName} {submission.lastName}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {submission.email}
                        </span>
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {submission.phone}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(submission.status)} text-white`}>
                      {submission.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Service Needed</p>
                      <p className="text-gray-600 dark:text-gray-400">{submission.serviceNeeded}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Project Details</p>
                      <p className="text-gray-600 dark:text-gray-400">{submission.projectDetails}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Submitted {new Date(submission.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedLead(submission);
                        setIsStatusDialogOpen(true);
                      }}
                    >
                      Update Status
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleConvertToProject(submission)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convert to Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedLead?.firstName} {selectedLead?.lastName}'s inquiry
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div>
                <Badge className={`${getStatusColor(selectedLead?.status || '')} text-white`}>
                  {selectedLead?.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Update to</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusUpdate('new')}
                  disabled={updateStatusMutation.isPending}
                  className="justify-start"
                >
                  New
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusUpdate('contacted')}
                  disabled={updateStatusMutation.isPending}
                  className="justify-start"
                >
                  Contacted
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusUpdate('converted')}
                  disabled={updateStatusMutation.isPending}
                  className="justify-start"
                >
                  Converted
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusUpdate('closed')}
                  disabled={updateStatusMutation.isPending}
                  className="justify-start"
                >
                  Closed
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}