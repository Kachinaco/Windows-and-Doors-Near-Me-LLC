import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Minus, Calculator, FileText, Phone } from "lucide-react";

interface QuoteItem {
  id: string;
  productType: string;
  quantity: number;
  width: string;
  height: string;
  configuration: {
    frameColor: string;
    glassType: string;
    gridPattern: string;
    hardware: string;
    operatingType: string;
  };
  unitPrice: number;
  totalPrice: number;
}

const frameColors = [
  { value: "white", label: "White", color: "#FFFFFF" },
  { value: "bronze", label: "Bronze", color: "#8B4513" },
  { value: "black", label: "Black", color: "#000000" },
  { value: "tan", label: "Tan", color: "#D2B48C" },
  { value: "clay", label: "Clay", color: "#A0522D" }
];

const glassTypes = [
  { value: "clear", label: "Clear Glass", price: 0 },
  { value: "low-e", label: "Low-E Glass", price: 45 },
  { value: "tempered", label: "Tempered Glass", price: 85 },
  { value: "laminated", label: "Laminated Glass", price: 120 },
  { value: "impact", label: "Impact Resistant", price: 180 }
];

const gridPatterns = [
  { value: "none", label: "No Grids", price: 0 },
  { value: "colonial", label: "Colonial Pattern", price: 25 },
  { value: "prairie", label: "Prairie Style", price: 30 },
  { value: "diamond", label: "Diamond Pattern", price: 40 },
  { value: "custom", label: "Custom Pattern", price: 55 }
];

const operatingTypes = [
  { value: "single-hung", label: "Single Hung", basePrice: 320 },
  { value: "double-hung", label: "Double Hung", basePrice: 385 },
  { value: "casement", label: "Casement", basePrice: 450 },
  { value: "sliding", label: "Sliding", basePrice: 295 },
  { value: "awning", label: "Awning", basePrice: 375 },
  { value: "fixed", label: "Fixed/Picture", basePrice: 245 }
];

export default function QuotePage() {
  const [, setLocation] = useLocation();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<QuoteItem>>({
    productType: "Milgard Tuscany® Series V400",
    quantity: 1,
    width: "",
    height: "",
    configuration: {
      frameColor: "white",
      glassType: "clear",
      gridPattern: "none",
      hardware: "standard",
      operatingType: "double-hung"
    }
  });

  // Load selected product from sessionStorage
  useEffect(() => {
    const selectedProduct = sessionStorage.getItem('selectedProduct');
    if (selectedProduct) {
      setCurrentItem(prev => ({
        ...prev,
        productType: selectedProduct
      }));
    }
  }, []);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [step, setStep] = useState<"configure" | "summary" | "contact">("configure");

  const calculateItemPrice = (item: Partial<QuoteItem>) => {
    if (!item.width || !item.height || !item.configuration?.operatingType) return 0;
    
    const width = parseFloat(item.width);
    const height = parseFloat(item.height);
    const area = (width * height) / 144; // Convert to square feet
    
    const basePrice = operatingTypes.find(op => op.value === item.configuration?.operatingType)?.basePrice || 0;
    const glassUpcharge = glassTypes.find(g => g.value === item.configuration?.glassType)?.price || 0;
    const gridUpcharge = gridPatterns.find(g => g.value === item.configuration?.gridPattern)?.price || 0;
    
    const unitPrice = Math.round((basePrice + glassUpcharge + gridUpcharge) * Math.max(area, 1));
    return unitPrice;
  };

  const addItemToQuote = () => {
    if (!currentItem.width || !currentItem.height) return;
    
    const unitPrice = calculateItemPrice(currentItem);
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      productType: currentItem.productType!,
      quantity: currentItem.quantity || 1,
      width: currentItem.width!,
      height: currentItem.height!,
      configuration: currentItem.configuration!,
      unitPrice,
      totalPrice: unitPrice * (currentItem.quantity || 1)
    };
    
    setQuoteItems([...quoteItems, newItem]);
    
    // Reset current item for next entry
    setCurrentItem({
      ...currentItem,
      width: "",
      height: "",
      quantity: 1
    });
  };

  const removeQuoteItem = (id: string) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  const getTotalPrice = () => {
    return quoteItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getCurrentItemPrice = () => {
    return calculateItemPrice(currentItem) * (currentItem.quantity || 1);
  };

  if (step === "contact") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setStep("summary")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quote Summary
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="(480) 555-0123"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Project Address</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder="123 Main St, Gilbert, AZ 85234"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                  placeholder="Any special requirements, timeline, or questions..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone}
                >
                  Submit Quote Request
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('tel:4809934392')}
                >
                  Call Now: (480) 993-4392
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "summary") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setStep("configure")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Configuration
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Quote Summary
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Quantity: {quoteItems.reduce((sum, item) => sum + item.quantity, 0)} Windows</div>
                  <div className="text-2xl font-bold text-orange-600">
                    ${getTotalPrice().toLocaleString()}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quoteItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{item.productType}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.width}" x {item.height}" - {operatingTypes.find(op => op.value === item.configuration.operatingType)?.label}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuoteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm mb-3">
                      <div>
                        <span className="font-medium">Frame:</span> {frameColors.find(c => c.value === item.configuration.frameColor)?.label}
                      </div>
                      <div>
                        <span className="font-medium">Glass:</span> {glassTypes.find(g => g.value === item.configuration.glassType)?.label}
                      </div>
                      <div>
                        <span className="font-medium">Grids:</span> {gridPatterns.find(g => g.value === item.configuration.gridPattern)?.label}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium px-3">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">${item.unitPrice.toLocaleString()} each</div>
                        <div className="font-bold">${item.totalPrice.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {quoteItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No items in quote yet. Go back to add windows.
                  </div>
                )}
              </div>

              {quoteItems.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-lg font-semibold">
                      Total: ${getTotalPrice().toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      *Prices are estimates. Final pricing may vary based on installation requirements.
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      size="lg" 
                      onClick={() => setStep("contact")}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Get Official Quote
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      Print Quote
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/catalog")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Window Configuration Tool
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure your {currentItem.productType} windows
              </p>
            </div>
            
            {quoteItems.length > 0 && (
              <Button 
                onClick={() => setStep("summary")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Quote ({quoteItems.length} items)
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Window Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="width">Width (inches) *</Label>
                    <Input
                      id="width"
                      type="number"
                      value={currentItem.width}
                      onChange={(e) => setCurrentItem({...currentItem, width: e.target.value})}
                      placeholder="36"
                      min="12"
                      max="120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (inches) *</Label>
                    <Input
                      id="height"
                      type="number"
                      value={currentItem.height}
                      onChange={(e) => setCurrentItem({...currentItem, height: e.target.value})}
                      placeholder="48"
                      min="12"
                      max="120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Operating Type</Label>
                    <Select
                      value={currentItem.configuration?.operatingType}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, operatingType: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operatingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} - ${type.basePrice}+
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Frame Color</Label>
                    <Select
                      value={currentItem.configuration?.frameColor}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, frameColor: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameColors.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2 border"
                                style={{ backgroundColor: color.color }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Glass Type</Label>
                    <Select
                      value={currentItem.configuration?.glassType}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, glassType: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {glassTypes.map(glass => (
                          <SelectItem key={glass.value} value={glass.value}>
                            {glass.label} {glass.price > 0 && `(+$${glass.price})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Grid Pattern</Label>
                    <Select
                      value={currentItem.configuration?.gridPattern}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, gridPattern: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gridPatterns.map(grid => (
                          <SelectItem key={grid.value} value={grid.value}>
                            {grid.label} {grid.price > 0 && `(+$${grid.price})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Calculator & Add to Quote */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Price Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentItem.width && currentItem.height ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>${operatingTypes.find(op => op.value === currentItem.configuration?.operatingType)?.basePrice || 0}</span>
                    </div>
                    {currentItem.configuration?.glassType !== 'clear' && (
                      <div className="flex justify-between text-sm">
                        <span>Glass Upgrade:</span>
                        <span>+${glassTypes.find(g => g.value === currentItem.configuration?.glassType)?.price || 0}</span>
                      </div>
                    )}
                    {currentItem.configuration?.gridPattern !== 'none' && (
                      <div className="flex justify-between text-sm">
                        <span>Grid Pattern:</span>
                        <span>+${gridPatterns.find(g => g.value === currentItem.configuration?.gridPattern)?.price || 0}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Unit Price:</span>
                      <span>${calculateItemPrice(currentItem).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total ({currentItem.quantity}x):</span>
                      <span className="text-orange-600">${getCurrentItemPrice().toLocaleString()}</span>
                    </div>
                    
                    <Button 
                      onClick={addItemToQuote}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-4"
                      disabled={!currentItem.width || !currentItem.height}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Quote
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Enter width and height to see pricing
                  </div>
                )}
              </CardContent>
            </Card>

            {quoteItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quote Items ({quoteItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quoteItems.slice(-3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        {item.width}" x {item.height}" ({item.quantity}x)
                      </div>
                      <div className="font-semibold">
                        ${item.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">${getTotalPrice().toLocaleString()}</span>
                  </div>
                  
                  <Button 
                    onClick={() => setStep("summary")}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    View Full Quote
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}