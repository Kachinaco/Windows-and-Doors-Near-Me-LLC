import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  User,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for customer profile
const customerProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type CustomerProfileFormData = z.infer<typeof customerProfileSchema>;

export default function CustomerSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for profile settings
  const profileForm = useForm<CustomerProfileFormData>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: CustomerProfileFormData) => {
      return apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: CustomerProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-4">Please log in to access settings</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                Profile Settings
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
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Update your personal information and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
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
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                        placeholder="john@example.com"
                        className="pl-10"
                      />
                    </div>
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        {...profileForm.register("phone")}
                        placeholder="(555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                    {profileForm.formState.errors.phone && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        type="text"
                        {...profileForm.register("address")}
                        placeholder="123 Main Street"
                        className="pl-10"
                      />
                    </div>
                    {profileForm.formState.errors.address && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        {...profileForm.register("city")}
                        placeholder="Gilbert"
                      />
                      {profileForm.formState.errors.city && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.city.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        type="text"
                        {...profileForm.register("state")}
                        placeholder="AZ"
                      />
                      {profileForm.formState.errors.state && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        {...profileForm.register("zipCode")}
                        placeholder="85234"
                      />
                      {profileForm.formState.errors.zipCode && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.zipCode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Information</h3>
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    You have a <strong>Customer (Free)</strong> account. This gives you access to window configuration tools, order tracking, and delivery information.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
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
      </main>
    </div>
  );
}