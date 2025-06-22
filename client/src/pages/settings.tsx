import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft,
  User,
  Building2,
  Save,
  Loader2,
  Phone,
  Mail,
  Cog as SettingsIcon,
  Key,
  Webhook,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Globe
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CompanySettings } from "@shared/schema";

// Form schemas
const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type CompanyFormData = z.infer<typeof companySchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Company form
  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: user?.companyName || "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile information.",
        variant: "destructive",
      });
    },
  });

  // Company update mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest("PUT", `/api/users/${user?.id}/company`, data);
    },
    onSuccess: () => {
      toast({
        title: "Company Updated",
        description: "Your company information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company information.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onCompanySubmit = (data: CompanyFormData) => {
    updateCompanyMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile Settings</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Company Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        {...profileForm.register("firstName")}
                        placeholder="John"
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        {...profileForm.register("lastName")}
                        placeholder="Doe"
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register("email")}
                      placeholder="john@example.com"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...profileForm.register("phone")}
                      placeholder="(555) 123-4567"
                    />
                    {profileForm.formState.errors.phone && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="min-w-32"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
                <CardDescription>
                  Manage your company details and branding settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      {...companyForm.register("companyName")}
                      placeholder="Kachina Windows and Doors"
                    />
                    {companyForm.formState.errors.companyName && (
                      <p className="text-sm text-red-600">
                        {companyForm.formState.errors.companyName.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      This name will appear in your dashboard header and throughout the application.
                    </p>
                  </div>

                  <Alert>
                    <Building2 className="h-4 w-4" />
                    <AlertDescription>
                      Your company name will be displayed as the main dashboard title and in various 
                      parts of the application. Choose a name that represents your business professionally.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateCompanyMutation.isPending}
                      className="min-w-32"
                    >
                      {updateCompanyMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}