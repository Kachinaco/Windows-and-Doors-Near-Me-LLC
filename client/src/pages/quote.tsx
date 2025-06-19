import { useState } from "react";
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
    outerGlass: string;
    innerGlass: string;
    isTempered: boolean;
    gridPattern: string;
    operatingType: string;
    operatingConfiguration?: string;
    energyPackage: string;
    finType: string;
  };
  unitPrice: number;
  totalPrice: number;
}

const productLines = [
  { value: "v300-trinsic", label: "V300 Trinsic", description: "MILGARD V300 TRINSIC WINDOW", pricePerSqFt: 25.80 },
  { value: "v350-tuscany", label: "V350 Tuscany", description: "MILGARD V350 TUSCANY WINDOW", pricePerSqFt: 28.50 },
  { value: "v450-montecito", label: "V450 Montecito", description: "MILGARD V450 MONTECITO WINDOW", pricePerSqFt: 32.20 }
];

const operatingTypes = [
  {
    value: "vertical-hung",
    label: "Vertical Hung",
    configurations: [
      { value: "single-hung", label: "Single Hung" },
      { value: "double-hung", label: "Double Hung" }
    ]
  },
  {
    value: "horizontal-slider",
    label: "Horizontal Slider", 
    configurations: [
      { value: "two-lite-slider", label: "Two Lite Slider" },
      { value: "three-lite-slider", label: "Three Lite Slider" }
    ]
  },
  {
    value: "slider-picture",
    label: "Slider Picture Windows",
    configurations: [
      { value: "xl-slider", label: "XL Slider" },
      { value: "xo-slider", label: "XO Slider" },
      { value: "ox-slider", label: "OX Slider" }
    ]
  }
];

const finTypes = [
  { value: "block-frame", label: "Block Frame" },
  { value: "flush-fin", label: "Flush Fin" },
  { value: "nail-fin", label: "Nail Fin" }
];

const energyPackages = [
  { value: "none", label: "None" },
  { value: "title-24", label: "Title 24 2019" }
];

const outerGlassTypes = [
  { value: "clear", label: "Clear", priceAdder: 0 },
  { value: "low-e", label: "Low-E", priceAdder: 2.50 },
  { value: "low-e-max", label: "Low E Max", priceAdder: 4.20 }
];

const innerGlassTypes = [
  { value: "clear", label: "Clear", priceAdder: 0 },
  { value: "obscure", label: "Obscure", priceAdder: 1.25 },
  { value: "4th-surface", label: "4th Surface Coating", priceAdder: 3.80 }
];

const frameColors = [
  { value: "white", label: "White" },
  { value: "bronze", label: "Bronze" },
  { value: "black", label: "Black" }
];

const gridPatterns = [
  { value: "none", label: "None" },
  { value: "colonial", label: "Colonial" },
  { value: "prairie", label: "Prairie" }
];

export default function QuotePage() {
  const { toast } = useToast();
  const [step, setStep] = useState<"configure" | "summary" | "contact">("configure");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [currentItem, setCurrentItem] = useState<QuoteItem>({
    id: "",
    productType: "V300 Trinsic",
    quantity: 1,
    width: "",
    height: "",
    configuration: {
      frameColor: "white",
      outerGlass: "clear",
      innerGlass: "clear",
      isTempered: false,
      gridPattern: "none",
      operatingType: "vertical-hung",
      operatingConfiguration: "single-hung",
      energyPackage: "none",
      finType: "nail-fin"
    },
    unitPrice: 0,
    totalPrice: 0
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const calculateItemPrice = (item: QuoteItem): number => {
    if (!item.width || !item.height) return 0;
    
    const sqFt = (parseFloat(item.width) * parseFloat(item.height)) / 144;
    const baseProduct = productLines.find(p => p.label === item.productType);
    let pricePerSqFt = baseProduct?.pricePerSqFt || 25.80;

    // Add glass pricing
    const outerGlass = outerGlassTypes.find(g => g.value === item.configuration.outerGlass);
    const innerGlass = innerGlassTypes.find(g => g.value === item.configuration.innerGlass);
    
    if (outerGlass) pricePerSqFt += outerGlass.priceAdder;
    if (innerGlass) pricePerSqFt += innerGlass.priceAdder;
    
    // Add tempered glass pricing
    if (item.configuration.isTempered) {
      pricePerSqFt += 4.85;
    }

    return sqFt * pricePerSqFt;
  };

  const addItemToQuote = () => {
    if (!currentItem.width || !currentItem.height) {
      toast({
        title: "Missing Information",
        description: "Please enter width and height",
        variant: "destructive"
      });
      return;
    }

    const newItem: QuoteItem = {
      ...currentItem,
      id: Date.now().toString(),
      unitPrice: calculateItemPrice(currentItem),
      totalPrice: calculateItemPrice(currentItem) * currentItem.quantity
    };

    setQuoteItems([...quoteItems, newItem]);
    
    // Reset for next item
    setCurrentItem({
      ...currentItem,
      id: "",
      width: "",
      height: "",
      quantity: 1
    });

    toast({
      title: "Item Added",
      description: "Window configuration added to quote"
    });
  };

  const getTotalPrice = (): number => {
    return quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/quote-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Quote Submitted",
        description: "Your quote request has been submitted successfully!"
      });
      setStep("configure");
      setQuoteItems([]);
      setCustomerInfo({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit quote request",
        variant: "destructive"
      });
    }
  });

  const handleSubmitQuote = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required customer information",
        variant: "destructive"
      });
      return;
    }

    if (quoteItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one window to your quote",
        variant: "destructive"
      });
      return;
    }

    submitQuoteMutation.mutate({
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      customerAddress: customerInfo.address,
      notes: customerInfo.notes,
      items: quoteItems,
      totalPrice: getTotalPrice(),
      status: "pending"
    });
  };

  if (step === "summary") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setStep("configure")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Configuration
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Quote Summary
            </h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent>
              {quoteItems.map((item, index) => (
                <div key={item.id} className="border-b pb-4 mb-4 last:border-b-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-medium">{item.productType}</p>
                      <p className="text-sm text-gray-500">{item.configuration.operatingType}</p>
                    </div>
                    <div>
                      <p className="text-sm">Dimensions: {item.width}" × {item.height}"</p>
                      <p className="text-sm">Quantity: {item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm">Glass: {item.configuration.outerGlass}/{item.configuration.innerGlass}</p>
                      <p className="text-sm">Frame: {item.configuration.frameColor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Quote Amount:</span>
                  <span className="text-orange-600">${getTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={() => setStep("contact")}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Submit Quote Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "contact") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setStep("summary")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Summary
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Contact Information
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="john@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="(480) 555-0123"
                  />
                </div>
              </div>

              <div>
                <Label>Project Address</Label>
                <Input
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder="123 Main St, Gilbert, AZ 85234"
                />
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                  placeholder="Any special requirements or notes about your project..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmitQuote}
                disabled={submitQuoteMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {submitQuoteMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Quote Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Window Configuration Tool
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your Milgard windows and get an instant quote
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Item Description</Label>
                    <div className="h-8 px-3 py-1 bg-white dark:bg-gray-700 border rounded-md text-sm flex items-center">
                      {productLines.find(p => p.label === currentItem.productType)?.description || "CONFIGURED WINDOW"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location/Level</Label>
                    <Input className="h-8 text-sm" placeholder="Living Room" />
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

            {/* Product Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Product Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label className="text-sm font-medium text-blue-600">Operating Style *</Label>
                    <Select
                      value={currentItem.configuration?.operatingType}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {
                          ...currentItem.configuration!, 
                          operatingType: value,
                          operatingConfiguration: operatingTypes.find(op => op.value === value)?.configurations?.[0]?.value || ""
                        }
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
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-600">Configuration Model *</Label>
                  <Select
                    value={currentItem.configuration?.operatingConfiguration}
                    onValueChange={(value) => setCurrentItem({
                      ...currentItem,
                      configuration: {...currentItem.configuration!, operatingConfiguration: value}
                    })}
                    disabled={!currentItem.configuration?.operatingType}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatingTypes
                        .find(op => op.value === currentItem.configuration?.operatingType)
                        ?.configurations?.map(config => (
                          <SelectItem key={config.value} value={config.value}>
                            {config.label}
                          </SelectItem>
                        )) || []}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-600">Fin Type *</Label>
                  <Select
                    value={currentItem.configuration?.finType}
                    onValueChange={(value) => setCurrentItem({
                      ...currentItem,
                      configuration: {...currentItem.configuration!, finType: value}
                    })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {finTypes.map(fin => (
                        <SelectItem key={fin.value} value={fin.value}>
                          {fin.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Packages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Packages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-sm font-medium text-blue-600">Energy Package *</Label>
                  <Select
                    value={currentItem.configuration?.energyPackage}
                    onValueChange={(value) => setCurrentItem({
                      ...currentItem,
                      configuration: {...currentItem.configuration!, energyPackage: value}
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
              </CardContent>
            </Card>

            {/* Glass */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Glass
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-blue-600">Glazing *</Label>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dual-glaze" name="glazing" checked={true} readOnly className="text-blue-600" />
                      <label htmlFor="dual-glaze" className="text-sm">Dual Glaze</label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-600">Customize Glass By Lite *</Label>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="customize-no" name="customize" checked={true} readOnly className="text-blue-600" />
                      <label htmlFor="customize-no" className="text-sm">No</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="customize-yes" name="customize" readOnly className="text-blue-600" />
                      <label htmlFor="customize-yes" className="text-sm">Yes</label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Tempered *</Label>
                    <Select
                      value={currentItem.configuration?.isTempered ? "yes" : "none"}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, isTempered: value === "yes"}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Glass Type Outer Lite *</Label>
                    <Select
                      value={currentItem.configuration?.outerGlass}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, outerGlass: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {outerGlassTypes.map(glass => (
                          <SelectItem key={glass.value} value={glass.value}>
                            {glass.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-600">Glass Type Inner Lite *</Label>
                  <Select
                    value={currentItem.configuration?.innerGlass}
                    onValueChange={(value) => setCurrentItem({
                      ...currentItem,
                      configuration: {...currentItem.configuration!, innerGlass: value}
                    })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {innerGlassTypes.map(glass => (
                        <SelectItem key={glass.value} value={glass.value}>
                          {glass.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Checkrail & Grids */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Checkrail & Grids
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-blue-600">Checkrail *</Label>
                  <Select value="none">
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-600">Customize Grids By Lite *</Label>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="grids-no" name="grids" checked={true} readOnly className="text-blue-600" />
                      <label htmlFor="grids-no" className="text-sm">No</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="grids-yes" name="grids" readOnly className="text-blue-600" />
                      <label htmlFor="grids-yes" className="text-sm">Yes</label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-blue-600">Grid Type *</Label>
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
              </CardContent>
            </Card>

            {/* Finishes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Finishes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Dimensions
                </CardTitle>
              </CardHeader>
              <CardContent>
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

                <div className="mt-6 pt-4 border-t flex gap-3 flex-wrap">
                  <Button 
                    onClick={addItemToQuote}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={!currentItem.width || !currentItem.height}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Price Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Base Price/sq ft:</span>
                    <span className="text-sm font-medium">
                      ${productLines.find(p => p.label === currentItem.productType)?.pricePerSqFt || 25.80}
                    </span>
                  </div>
                  
                  {currentItem.configuration.outerGlass !== 'clear' && (
                    <div className="flex justify-between">
                      <span className="text-sm">Outer Glass:</span>
                      <span className="text-sm font-medium">
                        +${outerGlassTypes.find(g => g.value === currentItem.configuration.outerGlass)?.priceAdder || 0}
                      </span>
                    </div>
                  )}
                  
                  {currentItem.configuration.innerGlass !== 'clear' && (
                    <div className="flex justify-between">
                      <span className="text-sm">Inner Glass:</span>
                      <span className="text-sm font-medium">
                        +${innerGlassTypes.find(g => g.value === currentItem.configuration.innerGlass)?.priceAdder || 0}
                      </span>
                    </div>
                  )}
                  
                  {currentItem.configuration.isTempered && (
                    <div className="flex justify-between">
                      <span className="text-sm">Tempered Glass:</span>
                      <span className="text-sm font-medium">+$4.85</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Current Item Total:</span>
                    <span className="text-orange-600">${calculateItemPrice(currentItem).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {quoteItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quote Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quoteItems.map((item, index) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.productType} ({item.quantity}x)</span>
                        <span>${item.totalPrice.toLocaleString()}</span>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold">
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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}