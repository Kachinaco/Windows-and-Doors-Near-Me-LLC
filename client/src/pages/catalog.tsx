import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Minus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  price: string;
  imageUrl: string;
  specifications: any;
  isActive: boolean;
}

interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  customizations: any;
  product: Product;
}

export default function CatalogPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch cart items
  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      const response = await apiRequest("POST", "/api/cart/add", { productId, quantity });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Product successfully added to your cart",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  // Update cart quantity
  const updateCartMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      if (quantity <= 0) {
        const response = await apiRequest("DELETE", `/api/cart/${cartItemId}`);
        return response.json();
      } else {
        const response = await apiRequest("PUT", `/api/cart/${cartItemId}`, { quantity });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (productId: number) => {
    const cartItem = cartItems.find((item) => item.productId === productId);
    return cartItem?.quantity || 0;
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product?.price || "0") * item.quantity);
    }, 0);
  };

  if (productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading Milgard products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Milgard Windows & Doors
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Premium windows and doors for your home
          </p>
        </div>
        
        {user && (
          <div className="mt-4 md:mt-0">
            <Button variant="outline" className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cartItems.length}) - ${getCartTotal().toFixed(2)}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="windows">Windows</SelectItem>
            <SelectItem value="doors">Doors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Products Found
          </h3>
          <p className="text-gray-500">
            {searchQuery || categoryFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Products will be loaded from the Milgard API"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => {
            const cartQuantity = getCartQuantity(product.id);
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                    {product.category}
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${product.price}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {user ? (
                    <div className="space-y-3">
                      {cartQuantity > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            In cart: {cartQuantity}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartMutation.mutate({ 
                                cartItemId: cartItems.find((item: CartItem) => item.productId === product.id)?.id || 0, 
                                quantity: cartQuantity - 1 
                              })}
                              disabled={updateCartMutation.isPending}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{cartQuantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartMutation.mutate({ 
                                cartItemId: cartItems.find((item: CartItem) => item.productId === product.id)?.id || 0, 
                                quantity: cartQuantity + 1 
                              })}
                              disabled={updateCartMutation.isPending}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => addToCartMutation.mutate({ productId: product.id })}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">Sign in to purchase</p>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}