import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calculator, FileText, Phone, CheckCircle, Image, X, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface QuoteItem {
  id: string;
  productType: string;
  quantity: number;
  width: string;
  height: string;
  callOut?: string;
  configuration: {
    openingType?: string;
    exteriorColor: string;
    interiorColor: string;
    outerGlass: string;
    innerGlass: string;
    isTempered: boolean;
    gridPattern: string;
    operatingType: string;
    operatingConfiguration?: string;
    energyPackage: string;
    finType: string;
    spacer: string;
    edgeGuard: string;
    argon: string;
  };
  unitPrice: number;
  totalPrice: number;
}

const allProductLines = [
  { value: "v300-trinsic", label: "V300 Trinsic", description: "MILGARD V300 TRINSIC WINDOW", pricePerSqFt: 31.00, tier: "customer" },
  { value: "v400-tuscany", label: "V400 Tuscany", description: "MILGARD V400 TUSCANY WINDOW", pricePerSqFt: 37.50, tier: "customer" },
  { value: "v450-montecito", label: "V450 Montecito", description: "MILGARD V450 MONTECITO WINDOW", pricePerSqFt: 44.50, tier: "contractor" }
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
      { value: "xo-slider", label: "XO Slider" },
      { value: "ox-slider", label: "OX Slider" },
      { value: "xox-slider", label: "XOX Slider" }
    ]
  },
  {
    value: "slider-picture",
    label: "Slider Picture Windows",
    configurations: [
      { value: "xl-slider", label: "XL Slider" },
      { value: "picture-window", label: "Picture Window" }
    ]
  }
];

const finTypes = [
  { value: "block-frame", label: "Block Frame" },
  { value: "flush-fin", label: "Flush Fin" },
  { value: "nail-fin", label: "Nail Fin" }
];

const energyPackages = [
  { value: "none", label: "None", priceAdder: 0 },
  { value: "title-24-2019", label: "Title 24 2019", priceAdder: 0 }
];

const outerGlassTypes = [
  { value: "clear", label: "Clear", priceAdder: -2.56 },
  { value: "sungaardmax-low-e", label: "SunGuardMAX (Low E)", priceAdder: 0 },
  { value: "low-e-max", label: "Low-E Max", priceAdder: 1.36 }
];

const spacerOptions = [
  { value: "black", label: "Black", priceAdder: 0 }
];

const argonOptions = [
  { value: "none", label: "None", priceAdder: 0 },
  { value: "argon", label: "Argon", priceAdder: 3.78 }
];

// Energy rating calculations based on glass configuration
const calculateEnergyRatings = (item: QuoteItem) => {
  // Base ratings for standard configuration
  let uFactor = 0.32;
  let shgc = 0.25;
  let vt = 0.70;

  // Title 24 2019 configuration (Low-E Max + EdgeGuard Max + Argon)
  if (item.configuration.energyPackage === 'title-24-2019') {
    uFactor = 0.28;
    shgc = 0.22;
    vt = 0.51;
  } else {
    // Individual glass type adjustments for non-Title 24
    if (item.configuration.outerGlass === 'low-e-max') {
      uFactor = 0.24;
      shgc = 0.21;
      vt = 0.68;
    } else if (item.configuration.outerGlass === 'sungaardmax-low-e') {
      uFactor = 0.26;
      shgc = 0.23;
      vt = 0.65;
    }

    // EdgeGuard Max improvement
    if (item.configuration.edgeGuard === 'edgeguardmax') {
      uFactor -= 0.02;
    }

    // Argon gas improvement
    if (item.configuration.argon === 'argon') {
      uFactor -= 0.01;
      shgc -= 0.01;
    }
  }

  // Energy package certification
  const energyStar = item.configuration.energyPackage === 'title-24-2019';

  return {
    uFactor: Math.max(0.15, uFactor).toFixed(2),
    shgc: Math.max(0.15, shgc).toFixed(2),
    vt: Math.min(0.90, vt).toFixed(2),
    energyStar
  };
};

const edgeGuardOptions = [
  { value: "none", label: "None", priceAdder: 0 },
  { value: "edgeguardmax", label: "EdgeGuard Max", priceAdder: 7.00 }
];

const innerGlassTypes = [
  { value: "clear", label: "Clear", priceAdder: 0 },
  { value: "obscure", label: "Obscure", priceAdder: 4.64 },
  { value: "4th-surface", label: "4th Surface Coating", priceAdder: 6.50 }
];

const frameColors = [
  { value: "white", label: "White", priceAdder: 0 },
  { value: "tan", label: "Tan", priceAdder: 0 },
  { value: "bronze", label: "Bronze", priceAdder: 0 },
  { value: "black", label: "Black", priceAdder: 28.00 }
];

// Get available interior colors based on exterior color selection
const getAvailableInteriorColors = (exteriorColor: string) => {
  switch (exteriorColor) {
    case "white":
      return [{ value: "white", label: "White" }];
    case "tan":
      return [{ value: "tan", label: "Tan" }];
    case "bronze":
      return [
        { value: "bronze", label: "Bronze" },
        { value: "white", label: "White" }
      ];
    case "black":
      return [
        { value: "black", label: "Black" },
        { value: "white", label: "White" }
      ];
    default:
      return frameColors;
  }
};

const gridPatterns = [
  { value: "none", label: "None" },
  { value: "colonial", label: "Colonial" },
  { value: "prairie", label: "Prairie" }
];

// Window gallery images data
const windowGalleries = {
  operatingTypes: [
    { id: 'horizontal-slider', name: 'Horizontal Sliders', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iNjAiIHkxPSIwIiB4Mj0iNjAiIHkyPSI4MCIgc3Ryb2tlPSIjNEI1NTYzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2ZyB4PSIyNSIgeT0iMzUiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cG9seWdvbiBwb2ludHM9IjAsMy41IDMsNSAwLDYuNSIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPHN2ZyB4PSI4NSIgeT0iMzUiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cG9seWdvbiBwb2ludHM9IjEwLDMuNSA3LDUgMTAsNi41IiBmaWxsPSIjNkI3Mjg0Ii8+Cjwvc3ZnPgo8L3N2Zz4=' },
    { id: 'vertical-hung', name: 'Vertical Sliders', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iMCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzRCNTU2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxzdmcgeD0iNTUiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSI+CiAgPHBvbHlnb24gcG9pbnRzPSIzLjUsMCA1LDMgNi41LDAiIGZpbGw9IiMzNzQxNTEiLz4KPC9zdmc+CjxzdmcgeD0iNTUiIHk9IjYwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSI+CiAgPHBvbHlnb24gcG9pbnRzPSIzLjUsMTAgNSw3IDYuNSwxMCIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPC9zdmc+' },
    { id: 'awning', name: 'Awning', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTAgMTBMMTEwIDEwIDExMCA3MCAiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjUwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzc0MTUxIj5Bd25pbmc8L3RleHQ+Cjwvc3ZnPg==' },
    { id: 'casement', name: 'Casement', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTEwIDEwTDEwIDEwIDEwIDcwIiBzdHJva2U9IiMzNzQxNTEiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8dGV4dCB4PSI0NSIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+Q2FzZW1lbnQ8L3RleHQ+Cjwvc3ZnPg==' },
    { id: 'picture', name: 'Picture Window', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzNSIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+Rml4ZWQ8L3RleHQ+Cjwvc3ZnPg==' },
    { id: 'slider-picture', name: 'Slider Picture Window', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iNDAiIHkxPSIwIiB4Mj0iNDAiIHkyPSI4MCIgc3Ryb2tlPSIjNEI1NTYzIiBzdHJva2Utd2lkdGg9IjIiLz4KPGxpbmUgeDE9IjgwIiB5MT0iMCIgeDI9IjgwIiB5Mj0iODAiIHN0cm9rZT0iIzRCNTU2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjE1IiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiMzNzQxNTEiPlg8L3RleHQ+Cjx0ZXh0IHg9IjU1IiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM2QjcyODQiPk88L3RleHQ+Cjx0ZXh0IHg9Ijk1IiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiMzNzQxNTEiPlg8L3RleHQ+Cjwvc3ZnPg==' }
  ],
  configurations: [
    { id: 'xo-slider', name: 'XO Slider', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iNjAiIHkxPSIwIiB4Mj0iNjAiIHkyPSI4MCIgc3Ryb2tlPSIjNEI1NTYzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2ZyB4PSIyNSIgeT0iMzUiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cG9seWdvbiBwb2ludHM9IjAsMy41IDMsNSAwLDYuNSIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPHN2ZyB4PSI4NSIgeT0iMzUiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cG9seWdvbiBwb2ludHM9IjEwLDMuNSA3LDUgMTAsNi41IiBmaWxsPSIjNkI3Mjg0Ii8+Cjwvc3ZnPgo8dGV4dCB4PSIyNSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+WDwvdGV4dD4KPHR4dCB4PSI4NSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZCNzI4NCI+TzwvdGV4dD4KPC9zdmc+' },
    { id: 'ox-slider', name: 'OX Slider', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iNjAiIHkxPSIwIiB4Mj0iNjAiIHkyPSI4MCIgc3Ryb2tlPSIjNEI1NTYzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2ZyB4PSI4NSIgeT0iMzUiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cG9seWdvbiBwb2ludHM9IjEwLDMuNSA3LDUgMTAsNi41IiBmaWxsPSIjMzc0MTUxIi8+Cjwvc3ZnPgo8dGV4dCB4PSIyNSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZCNzI4NCI+TzwvdGV4dD4KPHR4dCB4PSI4NSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+WDwvdGV4dD4KPC9zdmc+' },
    { id: 'xox-slider', name: 'XOX Slider', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iNDAiIHkxPSIwIiB4Mj0iNDAiIHkyPSI4MCIgc3Ryb2tlPSIjNEI1NTYzIiBzdHJva2Utd2lkdGg9IjIiLz4KPGxpbmUgeDE9IjgwIiB5MT0iMCIgeDI9IjgwIiB5Mj0iODAiIHN0cm9rZT0iIzRCNTU2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjE1IiB5PSIxNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzc0MTUxIj5YPC90ZXh0Pgo8dGV4dCB4PSI1NSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZCNzI4NCI+TzwvdGV4dD4KPHR4dCB4PSI5NSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzM3NDE1MSI+WDwvdGV4dD4KPC9zdmc+' },
    { id: 'single-hung', name: 'Single Hung', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iMCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzRCNTU2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxzdmcgeD0iNTUiIHk9IjYwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSI+CiAgPHBvbHlnb24gcG9pbnRzPSIzLjUsMTAgNSw3IDYuNSwxMCIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPC9zdmc+' },
    { id: 'double-hung', name: 'Double Hung', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8bGluZSB4MT0iMCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzRCNTU2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxzdmcgeD0iNTUiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSI+CiAgPHBvbHlnb24gcG9pbnRzPSIzLjUsMCA1LDMgNi41LDAiIGZpbGw9IiMzNzQxNTEiLz4KPC9zdmc+CjxzdmcgeD0iNTUiIHk9IjYwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSI+CiAgPHBvbHlnb24gcG9pbnRzPSIzLjUsMTAgNSw3IDYuNSwxMCIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4KPC9zdmc+' }
  ],
  glassTypes: [
    { id: 'clear-clear', name: 'Clear/Clear', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkFGQUZCIiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSI0MCIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiBmaWxsPSIjMzc0MTUxIj5DbGVhcjwvdGV4dD4KPC9zdmc+' },
    { id: 'low-e-clear', name: 'Low-E/Clear', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRUNGREY1IiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzNSIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiBmaWxsPSIjMzc0MTUxIj5Mb3ctRTwvdGV4dD4KPC9zdmc+' },
    { id: 'low-e-max-clear', name: 'Low-E Max/Clear', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkJGQ0ZFIiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyNSIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjMzc0MTUxIj5Mb3ctRSBNYXg8L3RleHQ+Cjwvc3ZnPg==' },
    { id: 'clear-obscure', name: 'Clear/Obscure', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjlGQUZCIiBzdHJva2U9IiM0QjVTNjMiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC43Ii8+Cjx0ZXh0IHg9IjMwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjkiIGZpbGw9IiMzNzQxNTEiPk9ic2N1cmU8L3RleHQ+Cjwvc3ZnPg==' }
  ]
};

export default function QuotePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"configure" | "summary" | "contact">("configure");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [openGallery, setOpenGallery] = useState<string | null>(null);
  const [viewAsCustomer, setViewAsCustomer] = useState(false);
  const [quoteName, setQuoteName] = useState<string>("Untitled Quote");

  // Load saved quote data when component mounts
  useEffect(() => {
    const savedQuote = localStorage.getItem('savedQuote');
    if (savedQuote) {
      try {
        const quote = JSON.parse(savedQuote);
        if (quote.name) {
          setQuoteName(quote.name);
        }
        if (quote.items) {
          setQuoteItems(quote.items);
        }
        if (quote.currentItem) {
          setCurrentItem(quote.currentItem);
        }
        if (quote.step) {
          setStep(quote.step);
        }
      } catch (error) {
        console.error('Error loading saved quote:', error);
      }
    }
  }, []);

  // Filter product lines based on user role/subscription and view toggle
  const getAvailableProductLines = () => {
    // Always show customer-tier products for non-authenticated users
    if (!user) {
      return allProductLines.filter(p => p.tier === "customer");
    }
    
    // Check user role/subscription level
    const userRole = user.role?.toLowerCase() || 'customer';
    console.log('User role:', userRole, 'View as customer:', viewAsCustomer);
    
    // If admin/contractor is viewing as customer, show customer products only
    if (viewAsCustomer && (userRole === 'admin' || userRole === 'contractor_paid')) {
      console.log('Admin/contractor viewing as customer - showing customer products only');
      return allProductLines.filter(p => p.tier === "customer");
    }
    
    // Customer tier users (including free customers) only see Trinsic and Tuscany
    const isCustomerTier = userRole === 'customer' || userRole === 'trial' || userRole === 'free' || !user.role;
    
    if (isCustomerTier) {
      console.log('Filtering to customer tier products');
      return allProductLines.filter(p => p.tier === "customer");
    } else {
      // Contractor (paid) and admin users see all products (when not in customer view)
      console.log('Showing all products for contractor/admin');
      return allProductLines;
    }
  };

  const productLines = getAvailableProductLines();

  const [currentItem, setCurrentItem] = useState<QuoteItem>({
    id: "",
    productType: productLines[0]?.label || "V300 Trinsic",
    quantity: 1,
    width: "",
    height: "",
    callOut: "",
    configuration: {
      openingType: "net-frame",
      exteriorColor: "white",
      interiorColor: "white",
      outerGlass: "clear",
      innerGlass: "clear",
      isTempered: false,
      gridPattern: "none",
      operatingType: "vertical-hung",
      operatingConfiguration: "single-hung",
      energyPackage: "none",
      finType: "nail-fin",
      spacer: "black",
      edgeGuard: "none",
      argon: "none"
    },
    unitPrice: 0,
    totalPrice: 0
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    needsInstallation: false
  });

  const resetCurrentItem = () => {
    setCurrentItem({
      id: "",
      productType: productLines[0]?.label || "V300 Trinsic",
      quantity: 1,
      width: "",
      height: "",
      callOut: "",
      configuration: {
        openingType: "net-frame",
        exteriorColor: "white",
        interiorColor: "white",
        outerGlass: "clear",
        innerGlass: "clear",
        isTempered: false,
        gridPattern: "none",
        operatingType: "vertical-hung",
        operatingConfiguration: "single-hung",
        energyPackage: "none",
        finType: "nail-fin",
        spacer: "black",
        edgeGuard: "none",
        argon: "none"
      },
      unitPrice: 0,
      totalPrice: 0
    });
  };

  // Function to parse dimension input (handles both "35.5" and "35 1/2" formats)
  const parseDimension = (input: string): number => {
    if (!input) return 0;
    
    // Handle fractional input like "35 1/2"
    const fractionMatch = input.match(/^(\d+)(?:\s+(\d+)\/(\d+))?$/);
    if (fractionMatch) {
      const whole = parseInt(fractionMatch[1]) || 0;
      const numerator = parseInt(fractionMatch[2]) || 0;
      const denominator = parseInt(fractionMatch[3]) || 1;
      return whole + (numerator / denominator);
    }
    
    // Handle decimal input like "35.5"
    const decimal = parseFloat(input);
    return isNaN(decimal) ? 0 : decimal;
  };

  const calculateItemPrice = (item: QuoteItem): number => {
    if (!item.width || !item.height) return 0;
    
    // Get actual dimensions for pricing calculations
    let actualWidth = parseDimension(item.width);
    let actualHeight = parseDimension(item.height);
    
    // For rough opening, subtract 0.5" from each dimension to get actual window size
    if (item.configuration?.openingType === "rough-opening") {
      actualWidth = Math.max(0, actualWidth - 0.5);
      actualHeight = Math.max(0, actualHeight - 0.5);
    }
    
    const sqFt = (actualWidth * actualHeight) / 144;
    const baseProduct = allProductLines.find(p => p.label === item.productType);
    let pricePerSqFt = baseProduct?.pricePerSqFt || 28.75;

    // Add energy package pricing
    const energyPackage = energyPackages.find(e => e.value === item.configuration.energyPackage);
    if (energyPackage) pricePerSqFt += energyPackage.priceAdder;

    // Add frame color pricing
    const exteriorColor = frameColors.find(c => c.value === item.configuration.exteriorColor);
    if (exteriorColor) pricePerSqFt += exteriorColor.priceAdder;

    // Add glass pricing
    const outerGlass = outerGlassTypes.find(g => g.value === item.configuration.outerGlass);
    const innerGlass = innerGlassTypes.find(g => g.value === item.configuration.innerGlass);
    
    if (outerGlass) pricePerSqFt += outerGlass.priceAdder;
    if (innerGlass) pricePerSqFt += innerGlass.priceAdder;
    
    // Add EdgeGuard pricing
    const edgeGuard = edgeGuardOptions.find(e => e.value === item.configuration.edgeGuard);
    if (edgeGuard) pricePerSqFt += edgeGuard.priceAdder;
    
    // Add spacer pricing
    const spacer = spacerOptions.find(s => s.value === item.configuration.spacer);
    if (spacer) pricePerSqFt += spacer.priceAdder;
    
    // Add argon pricing
    const argon = argonOptions.find(a => a.value === item.configuration.argon);
    if (argon) pricePerSqFt += argon.priceAdder;
    
    // Add tempered glass pricing
    if (item.configuration.isTempered) {
      pricePerSqFt += 35.20;
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
        notes: "",
        needsInstallation: false
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
      needsInstallation: customerInfo.needsInstallation,
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
              {quoteItems.map((item, index) => {
                const energyRatings = calculateEnergyRatings(item);
                const actualWidth = item.configuration?.openingType === "rough-opening" 
                  ? Math.max(0, parseDimension(item.width) - 0.5) 
                  : parseDimension(item.width);
                const actualHeight = item.configuration?.openingType === "rough-opening" 
                  ? Math.max(0, parseDimension(item.height) - 0.5) 
                  : parseDimension(item.height);
                const sqFt = (actualWidth * actualHeight) / 144;
                
                return (
                  <div key={item.id} className="border rounded-lg p-6 mb-6 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Window Details */}
                      <div className="lg:col-span-2">
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-gray-800">Window</h3>
                          <p className="text-sm text-gray-600 mb-2">CONFIGURED WINDOW</p>
                          <p className="font-semibold">{item.productType}, {item.width} x {item.height} {item.configuration.operatingConfiguration}, Ext {item.configuration.exteriorColor} / Int {item.configuration.interiorColor}, Call Out: 3030, U-Factor: {energyRatings.uFactor}, SHGC: {energyRatings.shgc}, VT: {energyRatings.vt}</p>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p><strong>Model =</strong> {item.configuration.operatingConfiguration === 'single-hung' ? 'Single Hung' : item.configuration.operatingConfiguration === 'double-hung' ? 'Double Hung' : 'Horizontal Slider'}</p>
                          <p><strong>Size =</strong> Net Frame: {actualWidth.toFixed(1)}" x {actualHeight.toFixed(1)}"</p>
                          <p><strong>Dimensions =</strong> Sash Height: One Tall, Southern, Meets Title 24 2019</p>
                          <p><strong>Energy =</strong> Title 24 2019</p>
                          <p><strong>Glass =</strong> 1/8" {item.configuration.outerGlass === 'sungaardmax-low-e' ? 'SunGuardMAX (Low-E)' : item.configuration.outerGlass === 'low-e-max' ? 'Low-E Max' : 'Clear'} over 1/8" {item.configuration.innerGlass === 'clear' ? 'Clear' : item.configuration.innerGlass === 'obscure' ? 'Obscure' : '4th Surface'} with {item.configuration.edgeGuard === 'edgeguardmax' ? 'EdgeGuardMAX' : 'Black'} {item.configuration.edgeGuard === 'edgeguardmax' ? 'Spacer' : 'Spacer'}</p>
                          <p><strong>Glazing =</strong> 3/4" IGU with {item.configuration.argon === 'argon' ? 'Argon' : 'Air'}</p>
                          <p><strong>Hardware =</strong> Standard Operation</p>
                          <p><strong>Grilles =</strong> {item.configuration.gridPattern === 'none' ? 'None' : item.configuration.gridPattern === 'colonial' ? 'Colonial Grille Pattern' : 'Prairie Grille Pattern'}</p>
                          <p><strong>Glazing Bead =</strong> Standard with Fiberglass Mesh, Screen Ship Loose</p>
                          <p><strong>Screen =</strong> Standard with Fiberglass Mesh, Screen Ship Loose</p>
                          <p><strong>Ratings =</strong> STC: 30, OITC: 26, PG: L-P-30-0</p>
                          <p><strong>Installs =</strong> 7.75 (Nominal) O.I. width x 17 (Nominal) O.I. height</p>
                          <p><strong>Calculations =</strong> Unit Area (Sq. Ft.): {sqFt.toFixed(2)}, Unit Perimeter (nominal in lineal ft): 12</p>
                          <p><strong>Other Ratings =</strong> CFD: MIL-A-525-1003-0001</p>
                        </div>
                      </div>
                      
                      {/* Right Column - Pricing and Preview */}
                      <div className="lg:col-span-1">
                        <div className="text-right mb-4">
                          <div className="text-sm text-gray-600">EA</div>
                          <div className="text-2xl font-bold">{item.totalPrice.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">{item.totalPrice.toFixed(2)}</div>
                          <div className="text-blue-600 underline cursor-pointer text-sm mt-1">Remove</div>
                        </div>
                        
                        {/* Window Preview */}
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            {/* Main Window Frame */}
                            <div 
                              className={`relative ${
                                item.configuration.exteriorColor === 'bronze' ? 'bg-yellow-100 border-yellow-800' :
                                item.configuration.exteriorColor === 'black' ? 'bg-gray-200 border-gray-900' :
                                item.configuration.exteriorColor === 'tan' ? 'bg-amber-100 border-amber-800' :
                                'bg-gray-100 border-gray-700'
                              } border-2`}
                              style={{
                                width: `${Math.max(120, Math.min(280, actualWidth * 3.5))}px`,
                                height: `${Math.max(120, Math.min(240, actualHeight * 3.5))}px`
                              }}
                            >
                              {/* Frame Detail Lines */}
                              <div className="absolute inset-1 border border-gray-500"></div>
                              <div className="absolute inset-2 border border-gray-400"></div>
                              
                              {/* Glass Area */}
                              <div className={`absolute inset-3 ${
                                item.configuration.outerGlass === 'low-e' ? 'bg-gradient-to-br from-green-50 to-blue-100' :
                                item.configuration.outerGlass === 'low-e-max' ? 'bg-gradient-to-br from-blue-100 to-purple-100' :
                                'bg-gradient-to-br from-blue-50 to-blue-100'
                              } ${
                                item.configuration.innerGlass === 'obscure' ? 'opacity-60' : 'opacity-80'
                              }`}>
                                
                                {/* Vertical Hung Windows */}
                                {item.configuration.operatingType === 'vertical-hung' && (
                                  <>
                                    {/* Meeting Rail (horizontal separator) */}
                                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-600 transform -translate-y-0.5"></div>
                                    
                                    {item.configuration.operatingConfiguration === 'single-hung' && (
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-gray-800"></div>
                                      </div>
                                    )}
                                    
                                    {item.configuration.operatingConfiguration === 'double-hung' && (
                                      <>
                                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-800"></div>
                                        </div>
                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-gray-800"></div>
                                        </div>
                                      </>
                                    )}
                                  </>
                                )}
                                
                                {/* Horizontal Slider Windows */}
                                {item.configuration.operatingType === 'horizontal-slider' && (
                                  <>
                                    {item.configuration.operatingConfiguration === 'xo-slider' && (
                                      <>
                                        {/* Left panel moves (X), right panel fixed (O) */}
                                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-600"></div>
                                        <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                          <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-gray-800"></div>
                                        </div>
                                        <div className="absolute left-2 top-2 text-sm font-bold text-gray-800">X</div>
                                        <div className="absolute right-2 top-2 text-sm font-bold text-gray-600">O</div>
                                      </>
                                    )}
                                    
                                    {item.configuration.operatingConfiguration === 'ox-slider' && (
                                      <>
                                        {/* Left panel fixed (O), right panel moves (X) */}
                                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-600"></div>
                                        <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                                          <div className="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-gray-800"></div>
                                        </div>
                                        <div className="absolute left-2 top-2 text-sm font-bold text-gray-600">O</div>
                                        <div className="absolute right-2 top-2 text-sm font-bold text-gray-800">X</div>
                                      </>
                                    )}
                                  </>
                                )}
                                
                                {/* Picture Window (no operating elements) */}
                                {item.configuration.operatingType === 'slider-picture' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-xs text-gray-500 font-medium">FIXED</div>
                                  </div>
                                )}
                                
                                {/* Grid Patterns */}
                                {item.configuration.gridPattern === 'colonial' && (
                                  <>
                                    {/* Upper sash (top half) - 3 columns x 2 rows */}
                                    {/* Horizontal line in middle of upper sash */}
                                    <div className="absolute left-0 right-0 h-0.5 bg-gray-700 opacity-80" style={{ top: '25%' }}></div>
                                    {/* Vertical lines for 3 columns in upper sash */}
                                    <div className="absolute top-0 bottom-1/2 left-1/3 w-0.5 bg-gray-700 opacity-80"></div>
                                    <div className="absolute top-0 bottom-1/2 left-2/3 w-0.5 bg-gray-700 opacity-80"></div>
                                    
                                    {/* Lower sash (bottom half) - 3 columns x 2 rows */}
                                    {/* Horizontal line in middle of lower sash */}
                                    <div className="absolute left-0 right-0 h-0.5 bg-gray-700 opacity-80" style={{ top: '75%' }}></div>
                                    {/* Vertical lines for 3 columns in lower sash */}
                                    <div className="absolute top-1/2 bottom-0 left-1/3 w-0.5 bg-gray-700 opacity-80"></div>
                                    <div className="absolute top-1/2 bottom-0 left-2/3 w-0.5 bg-gray-700 opacity-80"></div>
                                  </>
                                )}
                                
                                {item.configuration.gridPattern === 'prairie' && (
                                  <>
                                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-700 opacity-80"></div>
                                    <div className="absolute top-4 bottom-4 left-4 w-0.5 bg-gray-700 opacity-80"></div>
                                    <div className="absolute top-4 bottom-4 right-4 w-0.5 bg-gray-700 opacity-80"></div>
                                    <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-gray-700 opacity-80"></div>
                                  </>
                                )}
                              </div>
                              
                              {/* Energy Star Badge */}
                              {energyRatings.energyStar && (
                                <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded font-bold">
                                  ENERGY STAR
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="installation"
                  checked={customerInfo.needsInstallation}
                  onChange={(e) => setCustomerInfo({...customerInfo, needsInstallation: e.target.checked})}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <Label htmlFor="installation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  I need professional installation services
                </Label>
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

  // Save quote functionality
  const saveQuote = () => {
    const quoteData = {
      name: quoteName,
      items: quoteItems,
      currentItem: currentItem,
      step: step,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('savedQuote', JSON.stringify(quoteData));
    toast({
      title: "Quote Saved",
      description: `"${quoteName}" has been saved successfully.`,
    });
  };

  // Save quote to collection functionality
  const saveQuoteToCollection = () => {
    if (!quoteName.trim()) {
      toast({
        title: "Quote Name Required",
        description: "Please enter a name for your quote before saving.",
        variant: "destructive"
      });
      return;
    }

    if (quoteItems.length === 0) {
      toast({
        title: "No Items to Save",
        description: "Please add at least one window configuration before saving.",
        variant: "destructive"
      });
      return;
    }

    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const quoteData = {
      id: quoteId,
      name: quoteName.trim(),
      items: quoteItems,
      currentItem: currentItem,
      step: step,
      timestamp: new Date().toISOString()
    };

    // Get existing saved quotes collection
    const existingQuotes = localStorage.getItem('allSavedQuotes');
    let quotesArray = [];
    
    if (existingQuotes) {
      try {
        quotesArray = JSON.parse(existingQuotes);
      } catch (error) {
        console.error('Error parsing existing quotes:', error);
        quotesArray = [];
      }
    }

    // Add new quote to collection
    quotesArray.push(quoteData);
    
    // Save updated collection
    localStorage.setItem('allSavedQuotes', JSON.stringify(quotesArray));
    
    toast({
      title: "Quote Saved to Collection",
      description: `"${quoteName}" has been added to your saved quotes.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Window Configuration Tool
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={saveQuote}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
              <Button
                onClick={saveQuoteToCollection}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Admin View Toggle and Description */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-600 dark:text-gray-400">
              Configure your Milgard windows and get an instant quote
              {user && (user.role === 'admin' || user.role === 'contractor_paid') && viewAsCustomer && (
                <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                  (Customer View - V300/V400 only)
                </span>
              )}
            </p>
            {/* Admin View Toggle */}
            {user && (user.role === 'admin' || user.role === 'contractor_paid') && (
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border">
                <span className="text-sm text-gray-600 dark:text-gray-400">View as:</span>
                <button
                  onClick={() => setViewAsCustomer(false)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    !viewAsCustomer 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'Contractor'}
                </button>
                <button
                  onClick={() => setViewAsCustomer(true)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewAsCustomer 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Customer
                </button>
              </div>
            )}
          </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Quote Name *</Label>
                    <Input
                      className="h-8 text-sm"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      placeholder="Enter quote name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Item Description</Label>
                    <div className="h-8 px-3 py-1 bg-white dark:bg-gray-700 border rounded-md text-sm flex items-center">
                      {allProductLines.find(p => p.label === currentItem.productType)?.description || "CONFIGURED WINDOW"}
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

            {/* Dimensions Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Dimensions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-blue-600">Opening Type *</Label>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="rough-opening" 
                        name="opening-type" 
                        value="rough-opening"
                        checked={currentItem.configuration?.openingType === "rough-opening"}
                        onChange={(e) => setCurrentItem({
                          ...currentItem,
                          configuration: {...currentItem.configuration!, openingType: e.target.value}
                        })}
                        className="text-blue-600" 
                      />
                      <label htmlFor="rough-opening" className="text-sm">Rough Opening</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="net-frame" 
                        name="opening-type" 
                        value="net-frame"
                        checked={currentItem.configuration?.openingType === "net-frame" || !currentItem.configuration?.openingType}
                        onChange={(e) => setCurrentItem({
                          ...currentItem,
                          configuration: {...currentItem.configuration!, openingType: e.target.value}
                        })}
                        className="text-blue-600" 
                      />
                      <label htmlFor="net-frame" className="text-sm">Net Frame</label>
                    </div>
                  </div>
                </div>

                {currentItem.configuration?.openingType === "call-out" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Window Call Out (e.g. 3030, 3060) *</Label>
                      <Input
                        type="text"
                        placeholder="3030"
                        value={currentItem.callOut || ""}
                        onChange={(e) => {
                          const callOut = e.target.value;
                          // Parse call out like "3030" where each digit × 12 + 0
                          if (callOut.length === 4 && /^\d{4}$/.test(callOut)) {
                            const widthDigits = callOut.substring(0, 2);
                            const heightDigits = callOut.substring(2, 4);
                            
                            // Calculate width: each digit × 12 + 0
                            const width = (parseInt(widthDigits.charAt(0)) * 12 + parseInt(widthDigits.charAt(1)) * 12) + "\"";
                            
                            // Calculate height: each digit × 12 + 0  
                            const height = (parseInt(heightDigits.charAt(0)) * 12 + parseInt(heightDigits.charAt(1)) * 12) + "\"";
                            
                            setCurrentItem({
                              ...currentItem, 
                              callOut, 
                              width, 
                              height
                            });
                          } else {
                            setCurrentItem({...currentItem, callOut});
                          }
                        }}
                        className="h-8"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Enter 4 digits (e.g. 3030 = 36"×36", 2050 = 24"×60")
                        <br />Formula: Each digit × 12 (20 = 2×12 + 0×12 = 24", 50 = 5×12 + 0×12 = 60")
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Quantity *</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                        className="h-8"
                        min="1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Exact Width for 17 3/4" to 95 1/2" *</Label>
                      <Input
                        type="text"
                        placeholder="35.5 or 35 1/2"
                        value={currentItem.width}
                        onChange={(e) => setCurrentItem({...currentItem, width: e.target.value})}
                        className="h-8"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Enter as decimal (35.5) or fraction (35 1/2)
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Exact Height from 11 1/2" to 71 1/2" *</Label>
                      <Input
                        type="text"
                        placeholder="47.5 or 47 1/2"
                        value={currentItem.height}
                        onChange={(e) => setCurrentItem({...currentItem, height: e.target.value})}
                        className="h-8"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Enter as decimal (47.5) or fraction (47 1/2)
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Quantity *</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                        className="h-8"
                        min="1"
                      />
                    </div>
                  </div>
                )}


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
                    onValueChange={(value) => {
                      let updatedConfiguration = {...currentItem.configuration!, energyPackage: value};
                      
                      // Auto-select glass options when Title 24 2019 is chosen
                      if (value === "title-24-2019") {
                        updatedConfiguration.outerGlass = "low-e-max"; // Low-E Max glass
                        updatedConfiguration.edgeGuard = "edgeguardmax"; // EdgeGuard Max standalone
                        updatedConfiguration.argon = "argon"; // Argon gas
                      }
                      
                      setCurrentItem({
                        ...currentItem,
                        configuration: updatedConfiguration
                      });
                    }}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-600">EdgeGuard Max *</Label>
                    <Select
                      value={currentItem.configuration?.edgeGuard}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, edgeGuard: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {edgeGuardOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Spacer Finish *</Label>
                    <Select
                      value={currentItem.configuration?.spacer}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, spacer: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {spacerOptions.map(spacer => (
                          <SelectItem key={spacer.value} value={spacer.value}>
                            {spacer.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Gas Filled *</Label>
                    <Select
                      value={currentItem.configuration?.argon}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, argon: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {argonOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      value={currentItem.configuration?.exteriorColor}
                      onValueChange={(value) => {
                        const availableInteriorColors = getAvailableInteriorColors(value);
                        const newInteriorColor = availableInteriorColors.find(c => c.value === currentItem.configuration.interiorColor) 
                          ? currentItem.configuration.interiorColor 
                          : availableInteriorColors[0]?.value || value;
                        
                        setCurrentItem({
                          ...currentItem,
                          configuration: {
                            ...currentItem.configuration!, 
                            exteriorColor: value,
                            interiorColor: newInteriorColor
                          }
                        });
                      }}
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
                      value={currentItem.configuration?.interiorColor}
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        configuration: {...currentItem.configuration!, interiorColor: value}
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableInteriorColors(currentItem.configuration?.exteriorColor || "white").map(finish => (
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

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    onClick={addItemToQuote}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={!currentItem.width || !currentItem.height}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetCurrentItem}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Energy Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  Energy Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const ratings = calculateEnergyRatings(currentItem);
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-700">{ratings.uFactor}</div>
                          <div className="text-xs text-blue-600">U-Factor</div>
                          <div className="text-xs text-gray-500">BTU/hr·ft²·°F</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-700">{ratings.shgc}</div>
                          <div className="text-xs text-orange-600">SHGC</div>
                          <div className="text-xs text-gray-500">Solar Heat Gain</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-700">{ratings.vt}</div>
                          <div className="text-xs text-green-600">VT</div>
                          <div className="text-xs text-gray-500">Visible Light</div>
                        </div>
                      </div>
                      
                      {ratings.energyStar && (
                        <div className="flex items-center justify-center p-2 bg-green-100 rounded-lg">
                          <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-6.55 8.18L10 18z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-green-700">Title 24 2019 Compliant</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>• Lower U-Factor = Better insulation</div>
                        <div>• Lower SHGC = Less heat gain</div>
                        <div>• Higher VT = More natural light</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Window Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Window Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {/* Main Window Frame */}
                    <div 
                      className={`relative ${
                        currentItem.configuration.exteriorColor === 'bronze' ? 'bg-yellow-100 border-yellow-800' :
                        currentItem.configuration.exteriorColor === 'black' ? 'bg-gray-200 border-gray-900' :
                        currentItem.configuration.exteriorColor === 'tan' ? 'bg-amber-100 border-amber-800' :
                        'bg-gray-100 border-gray-700'
                      } border-2`}
                      style={{
                        width: currentItem.width ? `${Math.max(120, Math.min(280, (() => {
                          let width = parseDimension(currentItem.width);
                          if (currentItem.configuration?.openingType === "rough-opening") {
                            width = Math.max(0, width - 0.5);
                          }
                          return width * 3.5;
                        })()))}px` : '140px',
                        height: currentItem.height ? `${Math.max(120, Math.min(320, (() => {
                          let height = parseDimension(currentItem.height);
                          if (currentItem.configuration?.openingType === "rough-opening") {
                            height = Math.max(0, height - 0.5);
                          }
                          return height * 3.5;
                        })()))}px` : '180px'
                      }}
                    >
                      {/* Frame Detail Lines */}
                      <div className="absolute inset-1 border border-gray-500"></div>
                      <div className="absolute inset-2 border border-gray-400"></div>
                      
                      {/* Glass Area */}
                      <div className={`absolute inset-3 ${
                        currentItem.configuration.outerGlass === 'low-e' ? 'bg-gradient-to-br from-green-50 to-blue-100' :
                        currentItem.configuration.outerGlass === 'low-e-max' ? 'bg-gradient-to-br from-blue-100 to-purple-100' :
                        'bg-gradient-to-br from-blue-50 to-blue-100'
                      } ${
                        currentItem.configuration.innerGlass === 'obscure' ? 'opacity-60' : 'opacity-80'
                      }`}>
                        
                        {/* Vertical Hung Windows */}
                        {currentItem.configuration.operatingType === 'vertical-hung' && (
                          <>
                            {/* Meeting Rail (horizontal divider) */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-600 transform -translate-y-0.5"></div>
                            
                            {currentItem.configuration.operatingConfiguration === 'single-hung' && (
                              /* Bottom sash moves up (indicated by arrow) */
                              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-gray-700"></div>
                              </div>
                            )}
                            
                            {currentItem.configuration.operatingConfiguration === 'double-hung' && (
                              <>
                                {/* Both sashes move (indicated by arrows) */}
                                <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-700"></div>
                                </div>
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-gray-700"></div>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* Horizontal Slider Windows */}
                        {currentItem.configuration.operatingType === 'horizontal-slider' && (
                          <>
                            {currentItem.configuration.operatingConfiguration === 'xo-slider' && (
                              <>
                                {/* Left panel moves (X), right panel fixed (O) */}
                                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-600"></div>
                                <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-gray-800"></div>
                                </div>
                                <div className="absolute left-2 top-2 text-sm font-bold text-gray-800">X</div>
                                <div className="absolute right-2 top-2 text-sm font-bold text-gray-600">O</div>
                              </>
                            )}
                            
                            {currentItem.configuration.operatingConfiguration === 'ox-slider' && (
                              <>
                                {/* Left panel fixed (O), right panel moves (X) */}
                                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-600"></div>
                                <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                                  <div className="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-gray-800"></div>
                                </div>
                                <div className="absolute left-2 top-2 text-sm font-bold text-gray-600">O</div>
                                <div className="absolute right-2 top-2 text-sm font-bold text-gray-800">X</div>
                              </>
                            )}
                            
                            {currentItem.configuration.operatingConfiguration === 'xox-slider' && (
                              <>
                                {/* Left and right panels move (X), center panel fixed (O) */}
                                <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-gray-600"></div>
                                <div className="absolute top-0 bottom-0 right-1/3 w-1 bg-gray-600"></div>
                                <div className="absolute left-1/6 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-800"></div>
                                </div>
                                <div className="absolute right-1/6 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                                  <div className="w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-gray-800"></div>
                                </div>
                                <div className="absolute left-1 top-2 text-sm font-bold text-gray-800">X</div>
                                <div className="absolute left-1/2 top-2 transform -translate-x-1/2 text-sm font-bold text-gray-600">O</div>
                                <div className="absolute right-1 top-2 text-sm font-bold text-gray-800">X</div>
                              </>
                            )}
                          </>
                        )}

                        {/* Picture Window (no operating elements) */}
                        {currentItem.configuration.operatingType === 'slider-picture' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs text-gray-500 font-medium">FIXED</div>
                          </div>
                        )}

                        {/* Grid Pattern Overlay */}
                        {currentItem.configuration.gridPattern !== 'none' && (
                          <div className="absolute inset-0 pointer-events-none">
                            {currentItem.configuration.gridPattern === 'colonial' && (
                              <>
                                {/* Upper sash (top half) - 3 columns x 2 rows */}
                                {/* Horizontal line in middle of upper sash */}
                                <div className="absolute left-0 right-0 h-0.5 bg-gray-600 opacity-80" style={{ top: '25%' }}></div>
                                {/* Vertical lines for 3 columns in upper sash */}
                                <div className="absolute top-0 bottom-1/2 left-1/3 w-0.5 bg-gray-600 opacity-80"></div>
                                <div className="absolute top-0 bottom-1/2 left-2/3 w-0.5 bg-gray-600 opacity-80"></div>
                                
                                {/* Lower sash (bottom half) - 3 columns x 2 rows */}
                                {/* Horizontal line in middle of lower sash */}
                                <div className="absolute left-0 right-0 h-0.5 bg-gray-600 opacity-80" style={{ top: '75%' }}></div>
                                {/* Vertical lines for 3 columns in lower sash */}
                                <div className="absolute top-1/2 bottom-0 left-1/3 w-0.5 bg-gray-600 opacity-80"></div>
                                <div className="absolute top-1/2 bottom-0 left-2/3 w-0.5 bg-gray-600 opacity-80"></div>
                              </>
                            )}
                            {currentItem.configuration.gridPattern === 'prairie' && (
                              <>
                                <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-500 opacity-70"></div>
                                <div className="absolute top-3 bottom-3 left-3 w-0.5 bg-gray-500 opacity-70"></div>
                                <div className="absolute top-3 bottom-3 right-3 w-0.5 bg-gray-500 opacity-70"></div>
                                <div className="absolute bottom-3 left-3 right-3 h-0.5 bg-gray-500 opacity-70"></div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Tempered Glass Indicator */}
                        {currentItem.configuration.isTempered && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full opacity-80 border border-red-600"></div>
                        )}
                      </div>
                      
                      {/* Fin Type Indicators */}
                      {currentItem.configuration.finType === 'nail-fin' && (
                        <div className="absolute -inset-2 border-2 border-dashed border-gray-400 opacity-60"></div>
                      )}
                      {currentItem.configuration.finType === 'flush-fin' && (
                        <div className="absolute -inset-1 border border-solid border-gray-500 opacity-50"></div>
                      )}
                    </div>
                    
                    {/* Dimension Labels */}
                    {currentItem.width && currentItem.height && (
                      <>
                        {/* Width dimension */}
                        <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                          <div className="text-xs font-medium text-gray-700">
                            {(() => {
                              let width = parseDimension(currentItem.width);
                              if (currentItem.configuration?.openingType === "rough-opening") {
                                width = Math.max(0, width - 0.5);
                              }
                              return width;
                            })()}"
                          </div>
                        </div>
                        {/* Height dimension */}
                        <div className="absolute -left-8 top-0 bottom-0 flex items-center">
                          <div className="text-xs font-medium text-gray-700 transform -rotate-90">
                            {(() => {
                              let height = parseDimension(currentItem.height);
                              if (currentItem.configuration?.openingType === "rough-opening") {
                                height = Math.max(0, height - 0.5);
                              }
                              return height;
                            })()}"
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Configuration Summary */}
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span className="font-medium">{currentItem.productType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Style:</span>
                    <span className="font-medium capitalize">{currentItem.configuration.operatingType?.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frame:</span>
                    <span className="font-medium capitalize">{currentItem.configuration.exteriorColor}/{currentItem.configuration.interiorColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Glass:</span>
                    <span className="font-medium">{currentItem.configuration.outerGlass}/{currentItem.configuration.innerGlass}</span>
                  </div>
                  {currentItem.configuration.isTempered && (
                    <div className="flex justify-between">
                      <span>Tempered:</span>
                      <span className="font-medium text-red-600">Yes</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Price Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentItem.configuration?.openingType === "rough-opening" && currentItem.width && currentItem.height && (
                    <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <strong>Rough Opening Adjustment:</strong> Subtracting 0.5" from each dimension for actual window size
                      <br />
                      Actual Size: {Math.max(0, parseDimension(currentItem.width) - 0.5)}" × {Math.max(0, parseDimension(currentItem.height) - 0.5)}"
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Base Price/sq ft:</span>
                    <span className="text-sm font-medium">
                      ${allProductLines.find(p => p.label === currentItem.productType)?.pricePerSqFt || 25.80}
                    </span>
                  </div>
                  
                  {currentItem.configuration.exteriorColor !== 'white' && (
                    <div className="flex justify-between">
                      <span className="text-sm">Frame Color ({currentItem.configuration.exteriorColor}):</span>
                      <span className="text-sm font-medium">
                        +${frameColors.find(c => c.value === currentItem.configuration.exteriorColor)?.priceAdder || 0}
                      </span>
                    </div>
                  )}
                  
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