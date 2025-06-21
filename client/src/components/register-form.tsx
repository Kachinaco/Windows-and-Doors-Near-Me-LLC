import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertUser, insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, isRegisterPending, registerError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      companyName: "",
      role: "customer",
      subscriptionType: "free",
      subscriptionStatus: "active",
    },
  });

  const onSubmit = async (data: InsertUser) => {
    try {
      setError(null);
      
      // Set trial dates for contractor trial
      if (data.subscriptionType === "trial") {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        data.trialStartDate = now;
        data.trialEndDate = trialEnd;
      }
      
      await register(data);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-blue-900 dark:text-blue-100">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join our project management system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="profileType">Choose Your Profile Type</Label>
            <Select 
              value={form.watch("subscriptionType")} 
              onValueChange={(value) => {
                form.setValue("subscriptionType", value);
                if (value === "free") {
                  form.setValue("role", "customer");
                } else if (value === "trial") {
                  form.setValue("role", "contractor_trial");
                  // Set trial dates
                  const now = new Date();
                  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
                  form.setValue("trialStartDate", now);
                  form.setValue("trialEndDate", trialEnd);
                } else if (value === "paid") {
                  form.setValue("role", "contractor_paid");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select profile type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex flex-col">
                    <span className="font-medium">Customer (Free)</span>
                    <span className="text-sm text-gray-500">Basic project tracking</span>
                  </div>
                </SelectItem>
                <SelectItem value="trial">
                  <div className="flex flex-col">
                    <span className="font-medium">Contractor (30-Day Trial)</span>
                    <span className="text-sm text-gray-500">Full features for 30 days</span>
                  </div>
                </SelectItem>
                <SelectItem value="paid">
                  <div className="flex flex-col">
                    <span className="font-medium">Contractor (Paid)</span>
                    <span className="text-sm text-gray-500">Full features + premium tools</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                {...form.register("firstName")}
                placeholder="John"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                {...form.register("lastName")}
                placeholder="Doe"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              {...form.register("companyName")}
              placeholder="Kachina Windows and Doors"
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              {...form.register("username")}
              placeholder="johndoe"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="john@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              placeholder="(480) 933-4392"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              placeholder="Enter a secure password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Account Type</Label>
            <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
            )}
          </div>

          {(error || registerError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error || (registerError instanceof Error ? registerError.message : "Registration failed")}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isRegisterPending}>
            {isRegisterPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          {onSwitchToLogin && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToLogin}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Already have an account? Sign in
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}