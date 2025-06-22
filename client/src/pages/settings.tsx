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

  // Company settings query
  const { data: companySettings, isLoading: companySettingsLoading } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

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

  // Company settings update mutation
  const updateCompanySettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/company-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
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
      return apiRequest("POST", `/api/test-connection/${type}`, {});
    },
    onSuccess: (data, type) => {
      toast({
        title: "Connection Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} connection test passed.`,
      });
    },
    onError: (error, type) => {
      toast({
        title: "Connection Failed",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} connection test failed: ${error.message}`,
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

  // Company form handlers
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
          <TabsContent value="company" className="space-y-6">
            {/* Header Section */}
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

            {/* Company Information */}
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

            {/* OpenPhone Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-green-600" />
                  <span>OpenPhone Integration</span>
                  {companySettings?.enableOpenphoneSync && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your OpenPhone account to automatically track call communications with leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable OpenPhone Sync</Label>
                    <p className="text-sm text-gray-600">Automatically log calls and SMS messages</p>
                  </div>
                  <Switch
                    checked={isEditingCompany ? (companyFormData.enableOpenphoneSync || false) : (companySettings?.enableOpenphoneSync || false)}
                    onCheckedChange={(checked) => 
                      isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, enableOpenphoneSync: checked }))
                    }
                    disabled={!isEditingCompany}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Key className="w-4 h-4" />
                      <span>OpenPhone API Key</span>
                    </Label>
                    <Input
                      value={isEditingCompany ? (companyFormData.openphoneApiKey || '') : (companySettings?.openphoneApiKey || '')}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, openphoneApiKey: e.target.value }))}
                      placeholder="op_live_..."
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Phone className="w-4 h-4" />
                      <span>Business Phone Number</span>
                    </Label>
                    <Input
                      value={isEditingCompany ? (companyFormData.businessPhoneNumber || '') : (companySettings?.businessPhoneNumber || '')}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, businessPhoneNumber: e.target.value }))}
                      placeholder="+1234567890"
                      disabled={!isEditingCompany}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center space-x-2 mb-3">
                    <Webhook className="w-4 h-4" />
                    <span>Webhook URL</span>
                  </Label>
                  <Input
                    value={isEditingCompany ? (companyFormData.openphoneWebhookUrl || '') : (companySettings?.openphoneWebhookUrl || '')}
                    onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, openphoneWebhookUrl: e.target.value }))}
                    placeholder="https://your-domain.com/webhook/openphone"
                    disabled={!isEditingCompany}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    OpenPhone will send call and SMS events to this URL
                  </p>
                </div>

                {!isEditingCompany && companySettings?.openphoneApiKey && (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection('openphone')}
                      disabled={testConnectionMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gmail Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-red-600" />
                  <span>Gmail Integration</span>
                  {companySettings?.enableGmailSync && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your Gmail account to automatically track email communications with leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Gmail Sync</Label>
                    <p className="text-sm text-gray-600">Automatically log emails sent to and from leads</p>
                  </div>
                  <Switch
                    checked={isEditingCompany ? (companyFormData.enableGmailSync || false) : (companySettings?.enableGmailSync || false)}
                    onCheckedChange={(checked) => 
                      isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, enableGmailSync: checked }))
                    }
                    disabled={!isEditingCompany}
                  />
                </div>

                <Separator />

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Gmail OAuth Setup Required</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        To connect Gmail, you'll need to create a Google Cloud project and obtain OAuth credentials.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Key className="w-4 h-4" />
                      <span>Gmail Client ID</span>
                    </Label>
                    <Input
                      value={isEditingCompany ? (companyFormData.gmailClientId || '') : (companySettings?.gmailClientId || "")}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, gmailClientId: e.target.value }))}
                      placeholder="123456789-abc.apps.googleusercontent.com"
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Key className="w-4 h-4" />
                      <span>Gmail Client Secret</span>
                    </Label>
                    <Input
                      type={isEditingCompany ? "text" : "password"}
                      value={isEditingCompany ? (companyFormData.gmailClientSecret || '') : (companySettings?.gmailClientSecret || '')}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, gmailClientSecret: e.target.value }))}
                      placeholder="Enter Gmail client secret"
                      disabled={!isEditingCompany}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center space-x-2 mb-3">
                    <Key className="w-4 h-4" />
                    <span>Gmail Refresh Token</span>
                  </Label>
                  <Input
                    type={isEditingCompany ? "text" : "password"}
                    value={isEditingCompany ? (companyFormData.gmailRefreshToken || '') : (companySettings?.gmailRefreshToken || '')}
                    onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, gmailRefreshToken: e.target.value }))}
                    placeholder="OAuth refresh token for Gmail access"
                    disabled={!isEditingCompany}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This token is generated during the OAuth flow and allows continuous access to Gmail
                  </p>
                </div>

                {!isEditingCompany && companySettings?.gmailClientId && (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection('gmail')}
                      disabled={testConnectionMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-purple-600" />
                  <span>Additional Services</span>
                </CardTitle>
                <CardDescription>Configure payment processing and communication services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Stripe API Key</Label>
                    <Input
                      type={isEditingCompany ? "text" : "password"}
                      value={isEditingCompany ? (companyFormData.stripeApiKey || '') : (companySettings?.stripeApiKey || "")}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, stripeApiKey: e.target.value }))}
                      placeholder="sk_test_..."
                      disabled={!isEditingCompany}
                    />
                  </div>
                  <div>
                    <Label>SendGrid API Key</Label>
                    <Input
                      type={isEditingCompany ? "text" : "password"}
                      value={isEditingCompany ? (companyFormData.sendgridApiKey || '') : (companySettings?.sendgridApiKey || "")}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, sendgridApiKey: e.target.value }))}
                      placeholder="SG...."
                      disabled={!isEditingCompany}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Twilio Account SID</Label>
                    <Input
                      value={isEditingCompany ? (companyFormData.twilioAccountSid || '') : (companySettings?.twilioAccountSid || "")}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, twilioAccountSid: e.target.value }))}
                      placeholder="AC..."
                      disabled={!isEditingCompany}
                    />
                  </div>
                  <div>
                    <Label>Twilio Auth Token</Label>
                    <Input
                      type={isEditingCompany ? "text" : "password"}
                      value={isEditingCompany ? (companyFormData.twilioAuthToken || '') : (companySettings?.twilioAuthToken || "")}
                      onChange={(e) => isEditingCompany && setCompanyFormData((prev: any) => ({ ...prev, twilioAuthToken: e.target.value }))}
                      placeholder="Enter Twilio auth token"
                      disabled={!isEditingCompany}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}