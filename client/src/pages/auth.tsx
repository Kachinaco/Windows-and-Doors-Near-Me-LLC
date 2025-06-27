import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import LoginForm from "@/components/login-form";
import RegisterForm from "@/components/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();

  // Auto-login for development
  useEffect(() => {
    const autoLogin = async () => {
      try {
        await login({ username: "ADMIN", password: "TEST" });
      } catch (error) {
        console.log("Auto-login failed, showing login form");
      }
    };

    if (!isAuthenticated && !localStorage.getItem("authToken")) {
      autoLogin();
    }
  }, [isAuthenticated, login]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Brand */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Windows & Doors Near Me
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Professional Window & Door Services
          </p>
        </div>

        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}

        {/* Footer */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Professional window and door installation services in Gilbert, AZ and surrounding areas.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Call us: (480) 933-4392
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}