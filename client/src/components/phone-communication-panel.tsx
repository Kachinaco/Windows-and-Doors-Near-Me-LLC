import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  MessageSquare, 
  Send, 
  AlertTriangle,
  CheckCircle,
  Building2
} from "lucide-react";
import type { CompanySettings } from "@shared/schema";

interface PhoneCommunicationPanelProps {
  leadId: number;
  leadName: string;
  leadPhone: string;
}

export default function PhoneCommunicationPanel({ leadId, leadName, leadPhone }: PhoneCommunicationPanelProps) {
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const businessPhone = settings?.businessPhoneNumber || "Not configured";
  const isPhoneConfigured = Boolean(settings?.businessPhoneNumber && settings?.openphoneApiKey);

  // Validate phone number format
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
  };

  const sendTextMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!isValidPhone(leadPhone)) {
        throw new Error("Invalid phone number format");
      }
      
      const response = await apiRequest("POST", "/api/send-text", {
        leadId,
        phoneNumber: formatPhone(leadPhone),
        message,
        fromNumber: businessPhone
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Text Sent",
        description: `Message sent to ${leadName} from ${businessPhone}`,
      });
      setTextMessage("");
      setTextDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/communications?leadId=${leadId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Text",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logCallMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiRequest("POST", "/api/log-call", {
        leadId,
        phoneNumber: formatPhone(leadPhone),
        notes,
        fromNumber: businessPhone
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Call Logged",
        description: `Call with ${leadName} has been recorded`,
      });
      setCallNotes("");
      setCallDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/communications?leadId=${leadId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Log Call",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="w-5 h-5" />
          <span>Phone Communications</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Phone Display */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Your Business Number</span>
            </div>
            <Badge variant={isPhoneConfigured ? "default" : "destructive"}>
              {isPhoneConfigured ? "Connected" : "Not Configured"}
            </Badge>
          </div>
          <p className="text-blue-800 font-mono text-lg mt-1">{businessPhone}</p>
          <p className="text-xs text-blue-700 mt-1">
            All calls and texts will use this OpenPhone number
          </p>
        </div>

        {/* Lead Phone Validation */}
        <div className="bg-gray-50 border p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">Contact Number:</span>
            {isValidPhone(leadPhone) ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <p className="font-mono text-lg">{leadPhone}</p>
          {!isValidPhone(leadPhone) && (
            <p className="text-xs text-red-600 mt-1">
              Invalid phone number format - please update lead contact info
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={!isPhoneConfigured || !isValidPhone(leadPhone)}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Log Call
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Phone Call</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>From:</strong> {businessPhone} (Your OpenPhone)
                  </p>
                  <p className="text-sm text-blue-900">
                    <strong>To:</strong> {leadPhone} ({leadName})
                  </p>
                </div>
                <div>
                  <Label htmlFor="call-notes">Call Notes</Label>
                  <Textarea
                    id="call-notes"
                    placeholder="Enter call summary, next steps, or important details..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCallDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => logCallMutation.mutate(callNotes)}
                    disabled={logCallMutation.isPending || !callNotes.trim()}
                  >
                    Log Call
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={!isPhoneConfigured || !isValidPhone(leadPhone)}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Text
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Text Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>From:</strong> {businessPhone} (Your OpenPhone)
                  </p>
                  <p className="text-sm text-blue-900">
                    <strong>To:</strong> {leadPhone} ({leadName})
                  </p>
                </div>
                <div>
                  <Label htmlFor="text-message">Message</Label>
                  <Textarea
                    id="text-message"
                    placeholder="Type your message..."
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {textMessage.length}/160 characters
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => sendTextMutation.mutate(textMessage)}
                    disabled={sendTextMutation.isPending || !textMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Text
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!isPhoneConfigured && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Setup Required</span>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Configure your OpenPhone API key and business number in Company Settings to enable communications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}