import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calculator, FileText, Phone, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
    operatingType: string;
  };
  unitPrice: number;
  totalPrice: number;
}

// Milgard Product Lines with pricing per sq ft
const productLines = [
  {
    value: "tuscany-v400",
    label: "Milgard Tuscany® Series V400",
    description: "CONFIGURED WINDOW",
    pricePerSqFt: 28.50,
    category: "Vinyl Series"
  },
  {
    value: "trinsic-v300",
    label: "Milgard Trinsic® Series V300", 
    description: "CONFIGURED WINDOW",
    pricePerSqFt: 32.75,
    category: "Vinyl Series"
  },
  {
    value: "styleline-v250",
    label: "Milgard Style Line® Series V250",
    description: "CONFIGURED WINDOW", 
    pricePerSqFt: 26.90,
    category: "Vinyl Series"
  },
  {
    value: "ultra-c650",
    label: "Milgard Ultra™ Series C650",
    description: "CONFIGURED WINDOW",
    pricePerSqFt: 42.80,
    category: "Fiberglass Series"
  },
  {
    value: "aluminum-a250",
    label: "Thermally Improved Aluminum A250",
    description: "CONFIGURED WINDOW",
    pricePerSqFt: 35.60,
    category: "Aluminum Series"
  }
];

const frameColors = [
  { value: "white", label: "White", priceAdder: 0 },
  { value: "bronze", label: "Bronze", priceAdder: 1.25 },
  { value: "black", label: "Black", priceAdder: 1.25 },
  { value: "tan", label: "Tan", priceAdder: 1.25 },
  { value: "clay", label: "Clay", priceAdder: 1.25 },
  { value: "custom", label: "Custom Color", priceAdder: 2.50 }
];

const glassTypes = [
  { value: "clear", label: "Clear Glass", priceAdder: 0 },
  { value: "low-e", label: "Low-E Glass", priceAdder: 3.20 },
  { value: "tempered", label: "Tempered Glass", priceAdder: 4.85 },
  { value: "laminated", label: "Laminated Glass", priceAdder: 6.75 },
  { value: "impact", label: "Impact Resistant", priceAdder: 12.40 }
];

const gridPatterns = [
  { value: "none", label: "None", priceAdder: 0 },
  { value: "colonial", label: "Colonial", priceAdder: 1.80 },
  { value: "prairie", label: "Prairie", priceAdder: 2.10 },
  { value: "diamond", label: "Diamond", priceAdder: 2.85 },
  { value: "custom", label: "Custom Pattern", priceAdder: 3.50 }
];

const operatingTypes = [
  { value: "single-hung", label: "Single Hung", priceMultiplier: 1.0 },
  { value: "double-hung", label: "Double Hung", priceMultiplier: 1.15 },
  { value: "casement", label: "Casement", priceMultiplier: 1.35 },
  { value: "sliding", label: "Sliding", priceMultiplier: 0.95 },
  { value: "awning", label: "Awning", priceMultiplier: 1.25 },
  { value: "fixed", label: "Fixed/Picture", priceMultiplier: 0.85 }
];

const energyPackages = [
  { value: "standard", label: "Standard", priceAdder: 0 },
  { value: "energy-star", label: "ENERGY STAR®", priceAdder: 2.40 },
  { value: "high-performance", label: "High Performance", priceAdder: 4.90 }
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
      operatingType: "double-hung"
    }
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [step, setStep] = useState<"configure" | "summary" | "contact" | "success">("configure");
  const [submittedQuoteNumber, setSubmittedQuoteNumber] = useState("");
  const { toast } = useToast();

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

  const calculateItemPrice = (item: Partial<QuoteItem>) => {
    if (!item.width || !item.height || !item.productType) return 0;
    
    const width = parseFloat(item.width);
    const height = parseFloat(item.height);
    const area = (width * height) / 144; // Convert to square feet
    
    // Find base price per sq ft for product line
    const productLine = productLines.find(p => p.label === item.productType);
    if (!productLine) return 0;
    
    let pricePerSqFt = productLine.pricePerSqFt;
    
    // Apply operating type multiplier
    const operatingType = operatingTypes.find(op => op.value === item.configuration?.operatingType);
    if (operatingType) {
      pricePerSqFt *= operatingType.priceMultiplier;
    }
    
    // Add glass type adder
    const glassType = glassTypes.find(g => g.value === item.configuration?.glassType);
    if (glassType) {
      pricePerSqFt += glassType.priceAdder;
    }
    
    // Add grid pattern adder
    const gridPattern = gridPatterns.find(g => g.value === item.configuration?.gridPattern);
    if (gridPattern) {
      pricePerSqFt += gridPattern.priceAdder;
    }
    
    // Add frame color adder
    const frameColor = frameColors.find(c => c.value === item.configuration?.frameColor);
    if (frameColor) {
      pricePerSqFt += frameColor.priceAdder;
    }
    
    const unitPrice = Math.round(pricePerSqFt * area * 100) / 100;
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

  const getTotalPrice = () => {
    return quoteItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getCurrentItemPrice = () => {
    return calculateItemPrice(currentItem) * (currentItem.quantity || 1);
  };

  // Quote submission mutation
  const submitQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      return apiRequest("POST", "/api/quote-requests", quoteData);
    },
    onSuccess: (data) => {
      setSubmittedQuoteNumber(data.quoteNumber);
      setStep("success");
      toast({
        title: "Quote Request Submitted",
        description: `Your quote request ${data.quoteNumber} has been submitted successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuoteSubmission = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || quoteItems.length === 0) {
      return;
    }

    const quoteData = {
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      projectAddress: customerInfo.address || "",
      items: quoteItems,
      totalEstimate: getTotalPrice().toString(),
      notes: customerInfo.notes || "",
    };

    submitQuoteMutation.mutate(quoteData);
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
                  disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || submitQuoteMutation.isPending}
                  onClick={handleQuoteSubmission}
                >
                  {submitQuoteMutation.isPending ? "Submitting..." : "Submit Quote Request"}
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
                        onClick={() => setQuoteItems(quoteItems.filter(q => q.id !== item.id))}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        Quantity: {item.quantity}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Configuration Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Item Selection Header */}
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Item Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label className="text-sm font-medium">Window</Label>
                    <Select
                      value={currentItem.productType}
                      onValueChange={(value) => setCurrentItem({...currentItem, productType: value})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {productLines.map(product => (
                          <SelectItem key={product.value} value={product.label}>
                            {product.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="h-8 px-3 py-1 bg-white dark:bg-gray-700 border rounded-md text-sm flex items-center">
                      {productLines.find(p => p.label === currentItem.productType)?.description || "CONFIGURED WINDOW"}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Location/Level</Label>
                    <Input 
                      className="h-8 text-sm" 
                      placeholder="Living Room"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Qty</Label>
                    <Input
                      className="h-8 text-sm"
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

            {/* Configuration Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Configuration Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* First Row */}
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Product Line *</Label>
                    <Select
                      value={currentItem.productType}
                      onValueChange={(value) => setCurrentItem({...currentItem, productType: value})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {productLines.map(product => (
                          <SelectItem key={product.value} value={product.label}>
                            {product.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-600">Energy Package *</Label>
                    <Select
                      value={currentItem.configuration?.glassType}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, glassType: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {energyPackages.map(pkg => (
                          <SelectItem key={pkg.value} value={pkg.value}>
                            {pkg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-600">Opening Type *</Label>
                    <Select
                      value={currentItem.configuration?.operatingType}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, operatingType: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operatingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-600">Net Frame</Label>
                    <Select
                      value={currentItem.configuration?.frameColor}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, frameColor: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameColors.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Second Row */}
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Interior Glass</Label>
                    <Select
                      value={currentItem.configuration?.glassType}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, glassType: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {glassTypes.map(glass => (
                          <SelectItem key={glass.value} value={glass.value}>
                            {glass.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-600">Exterior Finish *</Label>
                    <Select
                      value={currentItem.configuration?.frameColor}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, frameColor: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameColors.map(finish => (
                          <SelectItem key={finish.value} value={finish.value}>
                            {finish.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-600">Interior Finish *</Label>
                    <Select
                      value={currentItem.configuration?.frameColor}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, frameColor: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameColors.map(finish => (
                          <SelectItem key={finish.value} value={finish.value}>
                            {finish.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-blue-600">Grid Pattern *</Label>
                    <Select
                      value={currentItem.configuration?.gridPattern}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, gridPattern: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gridPatterns.map(grid => (
                          <SelectItem key={grid.value} value={grid.value}>
                            {grid.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dimensions Section */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Width (inches) *</Label>
                      <Input
                        className="h-8"
                        type="number"
                        value={currentItem.width}
                        onChange={(e) => setCurrentItem({...currentItem, width: e.target.value})}
                        placeholder="36"
                        min="12"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Height (inches) *</Label>
                      <Input
                        className="h-8"
                        type="number"
                        value={currentItem.height}
                        onChange={(e) => setCurrentItem({...currentItem, height: e.target.value})}
                        placeholder="48"
                        min="12"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Square Feet</Label>
                      <div className="h-8 px-3 py-1 bg-gray-100 dark:bg-gray-700 border rounded-md text-sm flex items-center">
                        {currentItem.width && currentItem.height ? 
                          ((parseFloat(currentItem.width) * parseFloat(currentItem.height)) / 144).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Unit Price</Label>
                      <div className="h-8 px-3 py-1 bg-gray-100 dark:bg-gray-700 border rounded-md text-sm flex items-center font-semibold">
                        ${calculateItemPrice(currentItem).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t flex gap-3 flex-wrap">
                  <Button 
                    onClick={addItemToQuote}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={!currentItem.width || !currentItem.height}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <Button variant="outline" size="sm">
                    Add
                  </Button>
                  <Button variant="outline" size="sm">
                    Reset selection options
                  </Button>
                  <Button variant="outline" size="sm">
                    Library
                  </Button>
                  <Button variant="outline" size="sm">
                    Write to Dealer Options
                  </Button>
                  <Button variant="outline" size="sm">
                    Product Catalog
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Price Calculator & Quote Summary */}
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
                    <div className="flex justify-between text-sm">
                      <span>Base Price/sq ft:</span>
                      <span>${productLines.find(p => p.label === currentItem.productType)?.pricePerSqFt || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Square Feet:</span>
                      <span>{((parseFloat(currentItem.width) * parseFloat(currentItem.height)) / 144).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Unit Price:</span>
                      <span>${calculateItemPrice(currentItem).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total ({currentItem.quantity}x):</span>
                      <span className="text-orange-600">${getCurrentItemPrice().toLocaleString()}</span>
                    </div>
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