import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileText, PenTool, CreditCard, Download, CheckCircle, Clock, DollarSign, Calendar, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProposalData {
  id: number;
  title: string;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  projectAddress: string;
  invoice?: any;
  contract?: any;
  payment?: any;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  paidAt?: string;
}

const PAGE_TITLES = {
  1: "Invoice & Project Details",
  2: "Contract & Agreement", 
  3: "Payment & Schedule"
};

const PAGE_ICONS = {
  1: FileText,
  2: PenTool,
  3: CreditCard
};

export default function ProposalClientPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [signatureName, setSignatureName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [isSigningContract, setIsSigningContract] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch proposal data
  const { data: proposal, isLoading } = useQuery({
    queryKey: ['/api/proposals', id, 'client-view'],
    queryFn: () => apiRequest('GET', `/api/proposals/${id}/client-view`).then(res => res.json()),
    enabled: !!id
  });

  // Sign contract mutation
  const signContractMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/proposals/${id}/contract/${data.contractId}/sign`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', id, 'client-view'] });
      toast({
        title: "Contract Signed",
        description: "Thank you! Your signature has been recorded.",
      });
      setCurrentPage(3); // Move to payment page
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign contract. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/proposals/${id}/payment/${data.paymentId}/pay-milestone`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', id, 'client-view'] });
      toast({
        title: "Payment Processed",
        description: "Your payment has been processed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Payment could not be processed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSignContract = () => {
    if (!signatureName.trim()) {
      toast({
        title: "Signature Required",
        description: "Please enter your full name to sign the contract.",
        variant: "destructive",
      });
      return;
    }

    if (!proposal?.contract) return;

    signContractMutation.mutate({
      contractId: proposal.contract.id,
      signatureType: 'client',
      signatureName: signatureName,
      signatureData: `Signed by ${signatureName}`,
      ipAddress: '127.0.0.1' // In real app, get actual IP
    });
  };

  const handlePayMilestone = (milestoneId: string, amount: number) => {
    if (!proposal?.payment) return;

    processPaymentMutation.mutate({
      paymentId: proposal.payment.id,
      milestoneId,
      paymentMethodId: 'pm_test_123', // Mock payment method
      tipAmount: 0
    });
  };

  const getProgressPercentage = () => {
    if (!proposal) return 0;
    
    let progress = 0;
    if (proposal.viewedAt) progress = 25;
    if (proposal.contract?.signedByClient) progress = 75;
    if (proposal.paidAt) progress = 100;
    
    return progress;
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Proposal Not Found</h3>
            <p className="text-gray-600">This proposal may have been removed or the link is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
              <p className="text-gray-600 mt-1">Windows & Doors Near Me LLC</p>
            </div>
            <Badge className={`px-3 py-1 ${
              proposal.status === 'paid' ? 'bg-green-100 text-green-800' :
              proposal.status === 'signed' ? 'bg-blue-100 text-blue-800' :
              proposal.status === 'viewed' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Proposal Progress</span>
              <span>{getProgressPercentage()}% Complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
            {[1, 2, 3].map((page) => {
              const Icon = PAGE_ICONS[page as keyof typeof PAGE_ICONS];
              const isActive = currentPage === page;
              const isCompleted = page === 1 || 
                (page === 2 && proposal.contract?.signedByClient) ||
                (page === 3 && proposal.paidAt);
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isCompleted
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {PAGE_TITLES[page as keyof typeof PAGE_TITLES]}
                  {isCompleted && page !== currentPage && (
                    <CheckCircle className="w-4 h-4 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {currentPage === 1 && (
            <InvoicePage proposal={proposal} formatCurrency={formatCurrency} formatDate={formatDate} />
          )}
          
          {currentPage === 2 && (
            <ContractPage 
              proposal={proposal} 
              signatureName={signatureName}
              setSignatureName={setSignatureName}
              onSign={handleSignContract}
              isSigningContract={signContractMutation.isPending}
            />
          )}
          
          {currentPage === 3 && (
            <PaymentPage 
              proposal={proposal} 
              formatCurrency={formatCurrency}
              onPayMilestone={handlePayMilestone}
              isProcessingPayment={processPaymentMutation.isPending}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
            disabled={currentPage === 3}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Invoice Page Component
function InvoicePage({ proposal, formatCurrency, formatDate }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Invoice */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Project Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Company Info */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Windows & Doors Near Me LLC</h3>
                <p className="text-gray-600">Gilbert, Arizona</p>
                <p className="text-gray-600">Phone: (555) 123-4567</p>
                <p className="text-gray-600">Email: info@windowsanddoorsnearme.com</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">INVOICE</p>
                <p className="text-gray-600">#{proposal.invoice?.invoiceNumber || 'INV-001'}</p>
                <p className="text-gray-600">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                <p className="text-gray-800 font-medium">{proposal.clientName}</p>
                <p className="text-gray-600">{proposal.clientEmail}</p>
                {proposal.clientPhone && <p className="text-gray-600">{proposal.clientPhone}</p>}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Project Address:</h4>
                <p className="text-gray-600">{proposal.projectAddress}</p>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-gray-900">Window Installation Project</td>
                    <td className="px-4 py-3 text-right text-gray-600">1</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(8500)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(8500)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-900">Premium Installation Service</td>
                    <td className="px-4 py-3 text-right text-gray-600">1</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(1200)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(1200)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(9700)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax (8.6%):</span>
                  <span className="font-medium">{formatCurrency(834.20)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between py-2">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(10534.20)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Start Date:</span>
              <span className="ml-auto font-medium">TBD</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Duration:</span>
              <span className="ml-auto font-medium">2-3 Days</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Location:</span>
              <span className="ml-auto font-medium">Gilbert, AZ</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>(555) 123-4567</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span>info@windowsandoorsnearme.com</span>
            </div>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Contract Page Component
function ContractPage({ proposal, signatureName, setSignatureName, onSign, isSigningContract }: any) {
  const isAlreadySigned = proposal.contract?.signedByClient;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="flex items-center">
            <PenTool className="w-5 h-5 mr-2" />
            Service Agreement & Contract
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isAlreadySigned && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Contract Signed Successfully</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Signed on {formatDate(proposal.contract.clientSignature?.timestamp)}
              </p>
            </div>
          )}

          <div className="prose max-w-none mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Service Agreement</h3>
            
            <p className="text-gray-700 mb-4">
              This Service Agreement ("Agreement") is entered into between <strong>Windows & Doors Near Me LLC</strong> 
              ("Contractor") and <strong>{proposal.clientName}</strong> ("Client") for window installation services 
              at <strong>{proposal.projectAddress}</strong>.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Scope of Work</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Complete removal of existing windows</li>
              <li>Installation of new premium vinyl windows</li>
              <li>Professional sealing and weatherproofing</li>
              <li>Cleanup and disposal of old materials</li>
              <li>Final inspection and quality assurance</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Work to be completed within agreed timeline</li>
              <li>All materials and labor guaranteed for 2 years</li>
              <li>Client to provide access to work areas</li>
              <li>Payment schedule as outlined in proposal</li>
              <li>Change orders require written approval</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Warranty</h4>
            <p className="text-gray-700 mb-6">
              Contractor provides a comprehensive 2-year warranty on all installation work and a 
              manufacturer's warranty on all windows and materials used in the project.
            </p>
          </div>

          {!isAlreadySigned && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Electronic Signature</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signature-name">Full Legal Name</Label>
                  <Input
                    id="signature-name"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Enter your full legal name"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    By typing your name above, you agree to electronically sign this contract
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Electronic Signature Agreement:</strong> By clicking "Sign Contract" below, 
                    you acknowledge that you have read, understood, and agree to be bound by the terms 
                    of this Service Agreement. Your electronic signature has the same legal effect as 
                    a handwritten signature.
                  </p>
                </div>

                <Button 
                  onClick={onSign}
                  disabled={!signatureName.trim() || isSigningContract}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isSigningContract ? "Processing..." : "Sign Contract"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Payment Page Component
function PaymentPage({ proposal, formatCurrency, onPayMilestone, isProcessingPayment }: any) {
  const mockMilestones = [
    { id: "1", name: "Project Deposit", amount: 3500, status: "pending", dueDate: "Upon Signing" },
    { id: "2", name: "Material Delivery", amount: 4000, status: "pending", dueDate: "Start of Work" },
    { id: "3", name: "Project Completion", amount: 3034.20, status: "pending", dueDate: "Final Inspection" }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Schedule & Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Milestones</h3>
            <p className="text-gray-600">
              Your project is divided into convenient payment milestones for your peace of mind.
            </p>
          </div>

          <div className="space-y-4">
            {mockMilestones.map((milestone, index) => (
              <Card key={milestone.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Due: {milestone.dueDate}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(milestone.amount)}</p>
                    </div>
                    <div className="text-right">
                      {milestone.status === 'paid' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => onPayMilestone(milestone.id, milestone.amount)}
                          disabled={isProcessingPayment}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isProcessingPayment ? "Processing..." : "Pay Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Total Project Cost:</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(10534.20)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(10534.20)}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Secure Payment Processing</h4>
            <p className="text-blue-800 text-sm">
              All payments are processed securely through Stripe. We accept all major credit cards and ACH transfers.
              You'll receive email confirmations for all transactions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}