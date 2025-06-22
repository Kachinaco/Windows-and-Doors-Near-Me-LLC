import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  Settings, 
  Key, 
  Webhook,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import type { CompanySettings } from "@shared/schema";

export default function CompanySettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanySettings>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      const response = await apiRequest("PUT", "/api/company-settings", updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      setIsEditing(false);
      setFormData({});
      toast({
        title: "Settings Updated",
        description: "Your API settings have been saved successfully",
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

  const testConnectionMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("POST", `/api/test-connection/${type}`);
      return await response.json();
    },
    onSuccess: (data, type) => {
      toast({
        title: "Connection Successful",
        description: `${type === 'openphone' ? 'OpenPhone' : 'Gmail'} API connection is working`,
      });
    },
    onError: (error: Error, type) => {
      toast({
        title: "Connection Failed",
        description: `${type === 'openphone' ? 'OpenPhone' : 'Gmail'} API connection failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setFormData({
      openphoneApiKey: settings?.openphoneApiKey || "",
      openphoneWebhookUrl: settings?.openphoneWebhookUrl || "",
      gmailClientId: settings?.gmailClientId || "",
      gmailClientSecret: settings?.gmailClientSecret || "",
      gmailRefreshToken: settings?.gmailRefreshToken || "",
      enableOpenphoneSync: settings?.enableOpenphoneSync || false,
      enableGmailSync: settings?.enableGmailSync || false,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleTestConnection = (type: string) => {
    testConnectionMutation.mutate(type);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
              <p className="text-gray-600">Manage API integrations and system settings</p>
            </div>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          ) : (
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="integrations">API Integrations</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks & Sync</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            {/* OpenPhone Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <span>OpenPhone Integration</span>
                  {settings?.enableOpenphoneSync && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </CardTitle>
                <p className="text-gray-600">
                  Connect your OpenPhone account to automatically sync calls, texts, and contact data
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable OpenPhone Sync</Label>
                    <p className="text-sm text-gray-600">Automatically log calls and texts from OpenPhone</p>
                  </div>
                  <Switch
                    checked={isEditing ? formData.enableOpenphoneSync : settings?.enableOpenphoneSync}
                    onCheckedChange={(checked) => 
                      isEditing && setFormData(prev => ({ ...prev, enableOpenphoneSync: checked }))
                    }
                    disabled={!isEditing}
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
                      type="password"
                      value={isEditing ? formData.openphoneApiKey : "••••••••••••••••"}
                      onChange={(e) => isEditing && setFormData(prev => ({ ...prev, openphoneApiKey: e.target.value }))}
                      placeholder="Enter your OpenPhone API key"
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from OpenPhone Dashboard → Settings → API
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Webhook className="w-4 h-4" />
                      <span>Webhook URL</span>
                    </Label>
                    <Input
                      value={isEditing ? formData.openphoneWebhookUrl : settings?.openphoneWebhookUrl || ""}
                      onChange={(e) => isEditing && setFormData(prev => ({ ...prev, openphoneWebhookUrl: e.target.value }))}
                      placeholder="https://yourapp.com/api/openphone/webhook"
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Configure this URL in your OpenPhone webhook settings
                    </p>
                  </div>
                </div>

                {!isEditing && settings?.openphoneApiKey && (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection('openphone')}
                      disabled={testConnectionMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Test Connection</span>
                    </Button>
                    {settings.enableOpenphoneSync && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Active & Syncing</span>
                      </div>
                    )}
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
                  {settings?.enableGmailSync && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </CardTitle>
                <p className="text-gray-600">
                  Connect your Gmail account to automatically track email communications with leads
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Gmail Sync</Label>
                    <p className="text-sm text-gray-600">Automatically log emails sent to and from leads</p>
                  </div>
                  <Switch
                    checked={isEditing ? formData.enableGmailSync : settings?.enableGmailSync}
                    onCheckedChange={(checked) => 
                      isEditing && setFormData(prev => ({ ...prev, enableGmailSync: checked }))
                    }
                    disabled={!isEditing}
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
                      value={isEditing ? formData.gmailClientId : settings?.gmailClientId || ""}
                      onChange={(e) => isEditing && setFormData(prev => ({ ...prev, gmailClientId: e.target.value }))}
                      placeholder="123456789-abc.apps.googleusercontent.com"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label className="flex items-center space-x-2 mb-3">
                      <Key className="w-4 h-4" />
                      <span>Gmail Client Secret</span>
                    </Label>
                    <Input
                      type="password"
                      value={isEditing ? formData.gmailClientSecret : "••••••••••••••••"}
                      onChange={(e) => isEditing && setFormData(prev => ({ ...prev, gmailClientSecret: e.target.value }))}
                      placeholder="Enter Gmail client secret"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center space-x-2 mb-3">
                    <Key className="w-4 h-4" />
                    <span>Gmail Refresh Token</span>
                  </Label>
                  <Input
                    type="password"
                    value={isEditing ? formData.gmailRefreshToken : "••••••••••••••••"}
                    onChange={(e) => isEditing && setFormData(prev => ({ ...prev, gmailRefreshToken: e.target.value }))}
                    placeholder="OAuth refresh token for Gmail access"
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This token is generated during the OAuth flow and allows continuous access to Gmail
                  </p>
                </div>

                {!isEditing && settings?.gmailClientId && (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection('gmail')}
                      disabled={testConnectionMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Test Connection</span>
                    </Button>
                    {settings.enableGmailSync && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Active & Syncing</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Webhook className="w-6 h-6 text-purple-600" />
                  <span>Webhook Configuration</span>
                </CardTitle>
                <p className="text-gray-600">
                  Configure webhook endpoints for real-time data synchronization
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Available Webhook Endpoints</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <code className="bg-white px-2 py-1 rounded">/api/webhooks/openphone</code>
                      <span className="text-green-600">For OpenPhone call/SMS events</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="bg-white px-2 py-1 rounded">/api/webhooks/gmail</code>
                      <span className="text-red-600">For Gmail email events</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Setup Instructions</h4>
                      <ol className="text-sm text-yellow-800 mt-2 space-y-1">
                        <li>1. Configure your OpenPhone webhooks to point to the endpoints above</li>
                        <li>2. Set up Gmail push notifications using Google Pub/Sub</li>
                        <li>3. Test the connections using the test buttons in the API Integrations tab</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}