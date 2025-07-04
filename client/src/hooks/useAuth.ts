import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, LoginCredentials, InsertUser } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!localStorage.getItem("authToken"),
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        return response.json();
      } catch (err: any) {
        // If authentication fails, clear the invalid token
        if (err.message?.includes("401") || err.message?.includes("403")) {
          localStorage.removeItem("authToken");
          queryClient.setQueryData(["/api/auth/me"], null);
        }
        throw err;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      // Update query cache
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      // Update query cache
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}