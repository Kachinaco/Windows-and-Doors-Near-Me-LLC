import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  MapPin,
  Calendar,
  Clock,
  Package,
  Phone,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

export default function CustomerDelivery() {
  const { user, isLoading } = useAuth();

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
            <p className="text-lg mb-4">Please log in to view delivery information</p>
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sample delivery data
  const upcomingDeliveries = [
    {
      id: "DEL-001",
      orderNumber: "ORD-002",
      items: ["2x Milgard V400 Casement Windows (30\" x 42\")"],
      scheduledDate: "2024-06-25",
      timeWindow: "9:00 AM - 12:00 PM",
      status: "confirmed",
      driverName: "Mike Johnson",
      driverPhone: "(480) 555-0123",
      trackingNumber: "WIN987654321",
      specialInstructions: "Please call 30 minutes before arrival"
    }
  ];

  const recentDeliveries = [
    {
      id: "DEL-002",
      orderNumber: "ORD-001", 
      items: ["3x Milgard V300 Double Hung Windows (36\" x 48\")", "Installation Service"],
      deliveredDate: "2024-06-20",
      deliveredTime: "10:30 AM",
      status: "delivered",
      driverName: "Sarah Davis",
      signature: "John Smith",
      notes: "Left at front door per customer request"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "in_transit": return "secondary";
      case "delivered": return "outline";
      default: return "secondary";
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
                Delivery Information
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Delivery Tracking</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track your window and door deliveries</p>
        </div>

        {/* Delivery Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingDeliveries.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentDeliveries.length}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Delivery</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {upcomingDeliveries.length > 0 
                      ? new Date(upcomingDeliveries[0].scheduledDate).toLocaleDateString()
                      : "None scheduled"}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deliveries */}
        {upcomingDeliveries.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Deliveries</h3>
            <div className="space-y-4">
              {upcomingDeliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Delivery #{delivery.id}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Order #{delivery.orderNumber}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(delivery.status)}>
                        {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Delivery Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Items to be Delivered</h4>
                          <ul className="space-y-1">
                            {delivery.items.map((item, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">• {item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Scheduled Date</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(delivery.scheduledDate).toLocaleDateString()} - {delivery.timeWindow}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Tracking Number</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{delivery.trackingNumber}</p>
                          </div>
                        </div>
                      </div>

                      {/* Driver & Contact Info */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Truck className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Driver</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.driverName}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Contact Number</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{delivery.driverPhone}</p>
                          </div>
                        </div>

                        {delivery.specialInstructions && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Special Instructions</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">{delivery.specialInstructions}</p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm">
                            Track Live
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact Driver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Deliveries */}
        {recentDeliveries.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Recent Deliveries</h3>
            <div className="space-y-4">
              {recentDeliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>Delivery #{delivery.id}</span>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Order #{delivery.orderNumber}
                        </p>
                      </div>
                      <Badge variant="outline">Delivered</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Items Delivered</h4>
                          <ul className="space-y-1">
                            {delivery.items.map((item, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">• {item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Delivered</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(delivery.deliveredDate).toLocaleDateString()} at {delivery.deliveredTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Truck className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Delivered by</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.driverName}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Received by</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.signature}</p>
                          </div>
                        </div>

                        {delivery.notes && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Delivery Notes</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No deliveries state */}
        {upcomingDeliveries.length === 0 && recentDeliveries.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No deliveries scheduled</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Place an order to schedule your first delivery</p>
              <Link href="/quotes-manager">
                <Button>Browse Catalog</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}