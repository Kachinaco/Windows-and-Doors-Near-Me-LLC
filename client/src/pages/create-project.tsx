import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertClientSchema, InsertProject, InsertClient, type Client, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Clock,
  Calendar,
  User as UserIcon,
  Building2
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function CreateProjectPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<Partial<InsertProject>>({});

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const projectForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      serviceType: "",
      description: "",
      estimatedCost: "",
      priority: "medium",
      status: "pending",
      startDate: undefined,
      endDate: undefined,
      startTime: "",
      endTime: "",
      leadSource: "",
      clientId: undefined,
      assignedTo: undefined,
    },
  });

  const clientForm = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      jobTitle: "",
      website: "",
      additionalInfo: "",
      leadSource: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/projects");
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Create project with the new client
      const finalProjectData = {
        ...projectData,
        clientId: newClient.id,
      };
      createProjectMutation.mutate(finalProjectData as InsertProject);
    },
  });

  const onProjectSubmit = (data: InsertProject) => {
    setProjectData(data);
    setStep(2);
  };

  const onClientSubmit = (data: InsertClient) => {
    createClientMutation.mutate(data);
  };

  const handleExistingClient = (clientId: string) => {
    const finalProjectData = {
      ...projectData,
      clientId: parseInt(clientId),
    };
    createProjectMutation.mutate(finalProjectData as InsertProject);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role !== 'admin' && user.role !== 'employee') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to create projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Create project</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {step === 1 ? (
          <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Input
                {...projectForm.register("title")}
                placeholder="Project name*"
                className="w-full h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Select 
                value={projectForm.watch("serviceType")} 
                onValueChange={(value) => projectForm.setValue("serviceType", value)}
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Project type*" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Window Installation">Window Installation</SelectItem>
                  <SelectItem value="Door Installation">Door Installation</SelectItem>
                  <SelectItem value="Window Replacement">Window Replacement</SelectItem>
                  <SelectItem value="Door Replacement">Door Replacement</SelectItem>
                  <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                  <SelectItem value="Repair Service">Repair Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Input
                {...projectForm.register("leadSource")}
                placeholder="Lead source"
                className="w-full h-12 text-base"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">DATES</span>
                <span className="text-xs text-gray-500 ml-auto">Timezone: MDT/MST</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Start date</Label>
                  <Input
                    type="date"
                    {...projectForm.register("startDate")}
                    className="w-full h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Start time</Label>
                  <Input
                    type="time"
                    {...projectForm.register("startTime")}
                    className="w-full h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">End date</Label>
                  <Input
                    type="date"
                    {...projectForm.register("endDate")}
                    className="w-full h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">End time</Label>
                  <Input
                    type="time"
                    {...projectForm.register("endTime")}
                    className="w-full h-12 text-base"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Textarea
                {...projectForm.register("description")}
                placeholder="Project description"
                className="w-full min-h-[100px] text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Select 
                  value={projectForm.watch("priority")} 
                  onValueChange={(value) => projectForm.setValue("priority", value)}
                >
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Input
                  {...projectForm.register("estimatedCost")}
                  placeholder="Estimated cost"
                  className="w-full h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Select 
                value={projectForm.watch("assignedTo")?.toString()} 
                onValueChange={(value) => projectForm.setValue("assignedTo", parseInt(value))}
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Assigned employee" />
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

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Next: add client to project
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Add Client</h2>
              <p className="text-gray-600">Choose an existing client or add a new one</p>
            </div>

            {clients.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Select existing client:</h3>
                <div className="space-y-2">
                  {clients.map((client: Client) => (
                    <Card 
                      key={client.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleExistingClient(client.id.toString())}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{client.fullName}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </div>
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-gray-500">or</span>
                </div>
              </div>
            )}

            <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
              <h3 className="font-medium">Add new contact:</h3>
              
              <Input
                {...clientForm.register("fullName")}
                placeholder="Full name*"
                className="w-full h-12 text-base"
              />

              <Input
                {...clientForm.register("email")}
                type="email"
                placeholder="Email*"
                className="w-full h-12 text-base"
              />

              <Input
                {...clientForm.register("phone")}
                placeholder="Phone number"
                className="w-full h-12 text-base"
              />

              <Input
                {...clientForm.register("jobTitle")}
                placeholder="Job title"
                className="w-full h-12 text-base"
              />

              <Input
                {...clientForm.register("address")}
                placeholder="Address"
                className="w-full h-12 text-base"
              />

              <Input
                {...clientForm.register("website")}
                placeholder="Website"
                className="w-full h-12 text-base"
              />

              <Textarea
                {...clientForm.register("additionalInfo")}
                placeholder="Additional info"
                className="w-full min-h-[80px] text-base"
              />
              <p className="text-xs text-gray-500">Only visible to you</p>

              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 text-base"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={createClientMutation.isPending || createProjectMutation.isPending}
                  className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
                >
                  {createClientMutation.isPending || createProjectMutation.isPending 
                    ? "Creating..." 
                    : "Create Project"
                  }
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}