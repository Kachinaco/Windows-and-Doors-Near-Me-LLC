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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Calendar as CalendarIcon, Clock, User, MapPin, DollarSign, Check, X } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: number;
  jobName: string;
  customerId?: number;
  projectId?: number;
  assignedToId?: number;
  teamMembers: number[];
  customerSchedulingStatus: string;
  contractorAcceptanceStatus: string;
  shiftStartDate?: string;
  shiftEndDate?: string;
  duration: number;
  payoutAmount: number;
  description: string;
  requirements?: string;
  createdAt: string;
  assignedTo?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  };
}

const schedulingStatusOptions = [
  { value: "not_scheduled", label: "Not Scheduled", color: "bg-gray-100 text-gray-800" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" }
];

const acceptanceStatusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-800" }
];

export default function SchedulingPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Job created successfully",
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

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PUT", `/api/jobs/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
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

  const getStatusBadge = (status: string, options: typeof schedulingStatusOptions) => {
    const option = options.find(opt => opt.value === status);
    return (
      <Badge className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || status}
      </Badge>
    );
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startDateTime = formData.get("startDate") && formData.get("startTime") 
      ? new Date(`${formData.get("startDate")}T${formData.get("startTime")}`)
      : null;
    
    const duration = parseInt(formData.get("duration") as string) || 1;
    const endDateTime = startDateTime 
      ? new Date(startDateTime.getTime() + duration * 60 * 60 * 1000)
      : null;

    const data = {
      jobName: formData.get("jobName"),
      customerId: formData.get("customerId") ? parseInt(formData.get("customerId") as string) : null,
      assignedToId: formData.get("assignedToId") ? parseInt(formData.get("assignedToId") as string) : null,
      shiftStartDate: startDateTime?.toISOString(),
      shiftEndDate: endDateTime?.toISOString(),
      duration,
      payoutAmount: parseFloat(formData.get("payoutAmount") as string) || 0,
      description: formData.get("description"),
      requirements: formData.get("requirements"),
    };

    createJobMutation.mutate(data);
  };

  const handleStatusChange = (jobId: number, statusType: "scheduling" | "acceptance", newStatus: string) => {
    const updates = statusType === "scheduling" 
      ? { customerSchedulingStatus: newStatus }
      : { contractorAcceptanceStatus: newStatus };
    
    updateJobMutation.mutate({
      id: jobId,
      updates
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const upcomingJobs = Array.isArray(jobs) ? jobs.filter((job: Job) => {
    const startDate = job.shiftStartDate ? new Date(job.shiftStartDate) : null;
    return startDate && startDate > new Date();
  }).sort((a: Job, b: Job) => {
    const dateA = new Date(a.shiftStartDate || 0);
    const dateB = new Date(b.shiftStartDate || 0);
    return dateA.getTime() - dateB.getTime();
  }) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Scheduling</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage job assignments and crew scheduling</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
          >
            Calendar View
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <Label htmlFor="jobName">Job Name</Label>
                  <Input id="jobName" name="jobName" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerId">Customer</Label>
                    <Select name="customerId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(leads) && leads.map((lead: any) => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            {lead.firstName} {lead.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignedToId">Assign To</Label>
                    <Select name="assignedToId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(employees) && employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstName} {employee.lastName} ({employee.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" name="startTime" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input id="duration" name="duration" type="number" min="1" defaultValue="8" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payoutAmount">Payout Amount ($)</Label>
                  <Input id="payoutAmount" name="payoutAmount" type="number" step="0.01" />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>

                <div>
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea id="requirements" name="requirements" />
                </div>

                <Button type="submit" disabled={createJobMutation.isPending}>
                  {createJobMutation.isPending ? "Creating..." : "Schedule Job"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(jobs) ? jobs.length : 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Acceptance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(jobs) ? jobs.filter((job: Job) => job.contractorAcceptanceStatus === 'pending').length : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(jobs) ? jobs.filter((job: Job) => job.customerSchedulingStatus === 'scheduled').length : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingJobs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
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
      ) : !Array.isArray(jobs) || jobs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No jobs scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get started by scheduling your first job.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job: Job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{job.jobName}</CardTitle>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(job.customerSchedulingStatus, schedulingStatusOptions)}
                    {getStatusBadge(job.contractorAcceptanceStatus, acceptanceStatusOptions)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {job.shiftStartDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>{formatDateTime(job.shiftStartDate)}</span>
                    </div>
                  )}
                  
                  {job.duration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{job.duration} hours</span>
                    </div>
                  )}
                  
                  {job.assignedTo && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{job.assignedTo.firstName} {job.assignedTo.lastName}</span>
                    </div>
                  )}

                  {job.customer && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{job.customer.firstName} {job.customer.lastName}</span>
                    </div>
                  )}

                  {job.payoutAmount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>${job.payoutAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {job.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    {job.contractorAcceptanceStatus === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleStatusChange(job.id, 'acceptance', 'accepted')}
                          disabled={updateJobMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleStatusChange(job.id, 'acceptance', 'declined')}
                          disabled={updateJobMutation.isPending}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex gap-1 mt-2">
                    {schedulingStatusOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={job.customerSchedulingStatus === option.value ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleStatusChange(job.id, 'scheduling', option.value)}
                        disabled={updateJobMutation.isPending}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}