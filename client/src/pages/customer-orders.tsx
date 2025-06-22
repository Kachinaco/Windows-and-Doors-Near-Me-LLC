import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  Search,
  Calendar,
  MapPin,
  Phone,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function CustomerOrders() {
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
            <p className="text-lg mb-4">Please log in to view your orders</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sample customer orders data
  const orders = [
    {
      id: "ORD-001",
      date: "2024-06-15",
      status: "delivered",
      total: 2850.00,
      items: [
        { name: "Milgard V300 Double Hung Window", quantity: 3, size: "36\" x 48\"" },
        { name: "Installation Service", quantity: 1, description: "Professional installation" }
      ],
      deliveryDate: "2024-06-20",
      trackingNumber: "WIN123456789"
    },
    {
      id: "ORD-002", 
      date: "2024-06-22",
      status: "in_transit",
      total: 1950.00,
      items: [
        { name: "Milgard V400 Casement Window", quantity: 2, size: "30\" x 42\"" }
      ],
      estimatedDelivery: "2024-06-25",
      trackingNumber: "WIN987654321"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "default";
      case "in_transit": return "secondary";
      case "processing": return "outline";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered": return "Delivered";
      case "in_transit": return "In Transit";
      case "processing": return "Processing";
      default: return "Unknown";
    }
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
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Orders
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Summary */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track your window and door orders</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${orders.reduce((sum, order) => sum + order.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orders.filter(order => order.status !== "delivered").length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Placed on {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            {(item as any).size && <p className="text-sm text-gray-600 dark:text-gray-400">Size: {(item as any).size}</p>}
                            {(item as any).description && <p className="text-sm text-gray-600 dark:text-gray-400">{(item as any).description}</p>}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.status === "delivered" ? "Delivered" : "Estimated Delivery"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.deliveryDate 
                            ? new Date(order.deliveryDate).toLocaleDateString()
                            : order.estimatedDelivery 
                            ? new Date(order.estimatedDelivery).toLocaleDateString()
                            : "TBD"}
                        </p>
                      </div>
                    </div>
                    
                    {order.trackingNumber && (
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Tracking Number</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{order.trackingNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {order.status === "in_transit" && (
                      <Button variant="outline" size="sm">
                        Track Package
                      </Button>
                    )}
                    {order.status === "delivered" && (
                      <Button variant="outline" size="sm">
                        Reorder
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {orders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Start browsing our window and door catalog to place your first order</p>
              <Link href="/quotes-manager">
                <Button>Browse Windows & Doors</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}