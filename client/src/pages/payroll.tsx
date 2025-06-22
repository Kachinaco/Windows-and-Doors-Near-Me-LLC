import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Payroll() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
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
            <p className="text-lg mb-4">Please log in to access payroll</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sample payroll data - in real app this would come from API
  const employees = [
    {
      id: 1,
      name: "John Smith",
      role: "Lead Installer",
      hourlyRate: 28.50,
      hoursWorked: 40,
      overtime: 5,
      status: "pending"
    },
    {
      id: 2,
      name: "Mike Johnson",
      role: "Assistant Installer",
      hourlyRate: 22.00,
      hoursWorked: 38,
      overtime: 0,
      status: "paid"
    },
    {
      id: 3,
      name: "Sarah Davis",
      role: "Project Manager",
      hourlyRate: 32.00,
      hoursWorked: 42,
      overtime: 2,
      status: "pending"
    }
  ];

  const calculatePay = (employee: any) => {
    const regularPay = employee.hoursWorked * employee.hourlyRate;
    const overtimePay = employee.overtime * employee.hourlyRate * 1.5;
    return regularPay + overtimePay;
  };

  const totalPending = employees
    .filter(emp => emp.status === "pending")
    .reduce((sum, emp) => sum + calculatePay(emp), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage employee payments and timesheets</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pay Period</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">Dec 16-30</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Payroll Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Employee Payroll</CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Role</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Rate</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Hours</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Overtime</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Total Pay</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{employee.role}</td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                        ${employee.hourlyRate.toFixed(2)}/hr
                      </td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-white">{employee.hoursWorked}</td>
                      <td className="py-4 px-4 text-right text-gray-900 dark:text-white">{employee.overtime}</td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                        ${calculatePay(employee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={employee.status === "paid" ? "default" : "secondary"}>
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button size="sm" variant="outline">
                          {employee.status === "pending" ? "Pay Now" : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}