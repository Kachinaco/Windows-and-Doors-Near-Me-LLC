import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConsultationSchema, InsertConsultation, type Consultation, type Client, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus,
  Calendar,
  Clock,
  User as UserIcon,
  Building2,
  Edit,
  Trash2,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";

export default function ConsultationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const form = useForm<InsertConsultation>({
    resolver: zodResolver(insertConsultationSchema),
    defaultValues: {
      title: "",
      description: "",
      serviceType: "",
      consultationType: "in_home",
      appointmentDate: undefined,
      duration: 60,
      status: "scheduled",
      clientId: undefined,
      employeeId: undefined,
      address: "",
      notes: "",
      estimatedCost: "",
      followUpRequired: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertConsultation> }) => {
      const response = await apiRequest("PUT", `/api/consultations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      setEditingConsultation(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/consultations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
    },
  });

  const onSubmit = (data: InsertConsultation) => {
    if (editingConsultation) {
      updateMutation.mutate({ id: editingConsultation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    form.reset({
      title: consultation.title,
      description: consultation.description || "",
      serviceType: consultation.serviceType,
      consultationType: consultation.consultationType,
      appointmentDate: consultation.appointmentDate,
      duration: consultation.duration,
      status: consultation.status,
      clientId: consultation.clientId,
      employeeId: consultation.employeeId,
      address: consultation.address || "",
      notes: consultation.notes || "",
      estimatedCost: consultation.estimatedCost || "",
      followUpRequired: consultation.followUpRequired,
    });
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingConsultation(null);
    form.reset();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role !== 'admin' && user.role !== 'employee') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage consultations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consultation Management</h1>
            <Dialog open={isCreateModalOpen || !!editingConsultation} onOpenChange={handleCloseModal}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConsultation ? "Edit Consultation" : "Create New Consultation"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingConsultation ? "Update consultation details" : "Schedule a new consultation appointment"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Consultation Title*</Label>
                      <Input
                        id="title"
                        {...form.register("title")}
                        placeholder="e.g., Window Installation Consultation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Service Type*</Label>
                      <Select 
                        value={form.watch("serviceType")} 
                        onValueChange={(value) => form.setValue("serviceType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Window Installation">Window Installation</SelectItem>
                          <SelectItem value="Door Installation">Door Installation</SelectItem>
                          <SelectItem value="Window Replacement">Window Replacement</SelectItem>
                          <SelectItem value="Door Replacement">Door Replacement</SelectItem>
                          <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                          <SelectItem value="Repair Service">Repair Service</SelectItem>
                          <SelectItem value="Consultation Only">Consultation Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Detailed description of the consultation"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCost">Estimated Cost</Label>
                      <Input
                        id="estimatedCost"
                        {...form.register("estimatedCost")}
                        placeholder="$5,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consultationType">Consultation Type</Label>
                      <Select 
                        value={form.watch("consultationType")} 
                        onValueChange={(value) => form.setValue("consultationType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_home">In-Home Visit</SelectItem>
                          <SelectItem value="virtual">Virtual Meeting</SelectItem>
                          <SelectItem value="showroom">Showroom Visit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client*</Label>
                      <Select 
                        value={form.watch("clientId")?.toString()} 
                        onValueChange={(value) => form.setValue("clientId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Assigned Employee*</Label>
                      <Select 
                        value={form.watch("employeeId")?.toString()} 
                        onValueChange={(value) => form.setValue("employeeId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee: User) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointmentDate">Appointment Date*</Label>
                      <Input
                        id="appointmentDate"
                        type="datetime-local"
                        {...form.register("appointmentDate")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        {...form.register("duration", { valueAsNumber: true })}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={form.watch("status")} 
                        onValueChange={(value) => form.setValue("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...form.register("address")}
                      placeholder="Client address for in-home consultations"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      placeholder="Additional notes about the consultation"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="followUpRequired"
                      {...form.register("followUpRequired")}
                      className="rounded"
                    />
                    <Label htmlFor="followUpRequired">Follow-up required</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createMutation.isPending || updateMutation.isPending 
                        ? (editingConsultation ? "Updating..." : "Creating...") 
                        : (editingConsultation ? "Update Consultation" : "Create Consultation")
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-8">Loading consultations...</div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No consultations scheduled</h3>
            <p className="text-gray-600 dark:text-gray-400">Schedule your first consultation to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {consultations.map((consultation: Consultation) => {
              const client = clients.find(c => c.id === consultation.clientId);
              const employee = employees.find(e => e.id === consultation.employeeId);
              
              return (
                <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{consultation.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {consultation.serviceType}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(consultation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(consultation.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {format(new Date(consultation.appointmentDate), "PPP 'at' p")}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{consultation.duration} minutes</span>
                    </div>

                    {client && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{client.fullName}</span>
                      </div>
                    )}

                    {employee && (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {employee.firstName} {employee.lastName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        consultation.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        consultation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        consultation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {consultation.status.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      {consultation.estimatedCost && (
                        <span className="text-sm font-medium text-green-600">
                          {consultation.estimatedCost}
                        </span>
                      )}
                    </div>

                    {consultation.consultationType && (
                      <div className="text-xs text-gray-500 capitalize">
                        {consultation.consultationType.replace('_', ' ')} consultation
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}