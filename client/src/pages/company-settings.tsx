import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2,
  ArrowLeft,
  Save,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Company form
  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: user?.companyName || "",
    },
  });

  // Company update mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest("PUT", `/api/users/${user?.id}/company`, data);
    },
    onSuccess: () => {
      toast({
        title: "Company Settings Updated",
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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/settings")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Company Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
}