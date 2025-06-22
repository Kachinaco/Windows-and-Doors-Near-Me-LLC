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
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyFormData, setCompanyFormData] = useState<any>({});

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

  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
    enabled: user?.role !== 'customer',
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

  // Company settings update mutation
  const updateCompanySettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/company-settings`, data);
    },
    onSuccess: () => {
      toast({
        title: "Company Settings Updated",
        description: "Company settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      setIsEditingCompany(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company settings.",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (type: string) => {
      return apiRequest("POST", `/api/test-connection/${type}`, companyFormData);
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test Successful",
        description: "The connection test passed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "The connection test failed.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyFormData({
      companyName: companySettings?.companyName || '',
      businessAddress: companySettings?.businessAddress || '',
      businessWebsite: companySettings?.businessWebsite || '',
      licenseNumber: companySettings?.licenseNumber || '',
      openphoneApiKey: companySettings?.openphoneApiKey || '',
      businessPhoneNumber: companySettings?.businessPhoneNumber || '',
      openphoneWebhookUrl: companySettings?.openphoneWebhookUrl || '',
      gmailClientId: companySettings?.gmailClientId || '',
      gmailClientSecret: companySettings?.gmailClientSecret || '',
      gmailRefreshToken: companySettings?.gmailRefreshToken || '',
      stripeApiKey: companySettings?.stripeApiKey || '',
      sendgridApiKey: companySettings?.sendgridApiKey || '',
      twilioAccountSid: companySettings?.twilioAccountSid || '',
      twilioAuthToken: companySettings?.twilioAuthToken || '',
      enableOpenphoneSync: companySettings?.enableOpenphoneSync || false,
      enableGmailSync: companySettings?.enableGmailSync || false,
    });
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    setCompanyFormData({});
  };

  const handleSaveCompany = () => {
    updateCompanySettingsMutation.mutate(companyFormData);
  };

  const handleTestConnection = (type: string) => {
    testConnectionMutation.mutate(type);
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
        {user?.role === 'customer' ? (
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
        ) : (
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

            <TabsContent value="company" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage API integrations and system settings</p>
                </div>
                {!isEditingCompany ? (
                  <Button onClick={handleEditCompany} className="bg-blue-600 hover:bg-blue-700">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Edit Settings
                  </Button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={handleCancelCompany}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveCompany}
                      disabled={updateCompanySettingsMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <span>Company Information</span>
                  </CardTitle>
                  <CardDescription>Manage your company details and branding settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={isEditingCompany ? (companyFormData.companyName || '') : (companySettings?.companyName || "Windows & Doors Near Me LLC")}
                        onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your Company Name"
                        disabled={!isEditingCompany}
                      />
                    </div>
                    <div>
                      <Label>Business Address</Label>
                      <Input
                        value={isEditingCompany ? (companyFormData.businessAddress || '') : (companySettings?.businessAddress || "")}
                        onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, businessAddress: e.target.value }))}
                        placeholder="Gilbert, AZ"
                        disabled={!isEditingCompany}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}