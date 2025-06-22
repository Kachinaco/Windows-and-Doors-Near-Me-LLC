import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  FileText,
  Calculator,
  Save,
  Eye
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface SavedQuote {
  id: string;
  name: string;
  items: any[];
  currentItem: any;
  step: string;
  timestamp: string;
  totalPrice?: number;
}

export default function QuoteDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);

  // Load saved quotes from localStorage
  useEffect(() => {
    const loadSavedQuotes = () => {
      const quotes: SavedQuote[] = [];
      
      // Load individual saved quote
      const savedQuote = localStorage.getItem('savedQuote');
      if (savedQuote) {
        try {
          const quote = JSON.parse(savedQuote);
          quotes.push({
            id: 'main',
            name: 'Main Configuration',
            ...quote,
            totalPrice: calculateQuoteTotal(quote.items || [])
          });
        } catch (error) {
          console.error('Error parsing saved quote:', error);
        }
      }

      // Load multiple saved quotes if they exist
      const allQuotes = localStorage.getItem('allSavedQuotes');
      if (allQuotes) {
        try {
          const parsedQuotes = JSON.parse(allQuotes);
          quotes.push(...parsedQuotes.map((q: any) => ({
            ...q,
            totalPrice: calculateQuoteTotal(q.items || [])
          })));
        } catch (error) {
          console.error('Error parsing all saved quotes:', error);
        }
      }

      setSavedQuotes(quotes);
    };

    loadSavedQuotes();
  }, []);

  const calculateQuoteTotal = (items: any[]): number => {
    return items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  const formatDate = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleEditQuote = (quote: SavedQuote) => {
    // Load the quote data back into localStorage for editing
    localStorage.setItem('savedQuote', JSON.stringify({
      items: quote.items,
      currentItem: quote.currentItem,
      step: quote.step,
      timestamp: quote.timestamp
    }));
    
    toast({
      title: "Quote Loaded",
      description: "Quote has been loaded for editing.",
    });
    
    // Navigate to the quote configuration page
    setLocation('/quote');
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (quoteId === 'main') {
      localStorage.removeItem('savedQuote');
    } else {
      const allQuotes = localStorage.getItem('allSavedQuotes');
      if (allQuotes) {
        try {
          const quotes = JSON.parse(allQuotes);
          const updatedQuotes = quotes.filter((q: any) => q.id !== quoteId);
          localStorage.setItem('allSavedQuotes', JSON.stringify(updatedQuotes));
        } catch (error) {
          console.error('Error deleting quote:', error);
        }
      }
    }
    
    setSavedQuotes(prev => prev.filter(q => q.id !== quoteId));
    
    toast({
      title: "Quote Deleted",
      description: "Quote has been removed from saved quotes.",
    });
  };

  const handleViewQuote = (quote: SavedQuote) => {
    // Load quote data and go directly to summary view
    localStorage.setItem('savedQuote', JSON.stringify({
      items: quote.items,
      currentItem: quote.currentItem,
      step: 'summary',
      timestamp: quote.timestamp
    }));
    
    setLocation('/quote');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Window Quotes & Configurations
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create new quotes or manage your saved configurations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* New Quote Card */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => setLocation('/quote')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Create New Quote
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Start a fresh window configuration and get instant pricing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saved Quotes Summary Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Saved Quotes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {savedQuotes.length} saved configuration{savedQuotes.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Quotes Section */}
        {savedQuotes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Saved Quotes
              </h2>
              <Badge variant="secondary" className="text-sm">
                {savedQuotes.length} quote{savedQuotes.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {savedQuotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {quote.name || 'Untitled Quote'}
                        </CardTitle>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(quote.timestamp)}
                        </div>
                      </div>
                      <Badge 
                        variant={quote.step === 'summary' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {quote.step === 'configure' ? 'Draft' : 
                         quote.step === 'summary' ? 'Complete' : 
                         quote.step === 'contact' ? 'Pending' : 'In Progress'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Items:</span>
                        <span className="font-medium">{quote.items?.length || 0} window{(quote.items?.length || 0) !== 1 ? 's' : ''}</span>
                      </div>
                      {quote.totalPrice && quote.totalPrice > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total:</span>
                          <span className="font-bold text-green-600">${quote.totalPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuote(quote)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuote(quote)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {savedQuotes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Saved Quotes Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first window configuration to get started with quotes and pricing.
              </p>
              <Button onClick={() => setLocation('/quote')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quote
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}