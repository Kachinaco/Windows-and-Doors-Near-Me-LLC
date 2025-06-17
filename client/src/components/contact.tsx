import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Clock, Mail, Check, Send } from "lucide-react";
import type { InsertContactSubmission } from "@shared/schema";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertContactSubmission>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    serviceNeeded: "",
    projectDetails: ""
  });

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContactSubmission) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "Thank you for your request! We will contact you within 24 hours.",
      });
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        serviceNeeded: "",
        projectDetails: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem sending your request. Please try again.",
        variant: "destructive",
      });
      console.error("Contact form error:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof InsertContactSubmission, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Your Free Estimate Today</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to upgrade your windows and doors? Contact us for a free consultation and estimate. 
            We're here to help bring your vision to life.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <Card className="bg-light-blue border-0 mb-8">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-primary-blue p-3 rounded-full mr-4">
                      <MapPin className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Address</div>
                      <div className="text-gray-600">751 N Monterey St Suite 123<br />Gilbert, AZ 85233</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary-blue p-3 rounded-full mr-4">
                      <Phone className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Phone</div>
                      <div className="text-gray-600">
                        <a href="tel:4809334392" className="hover:text-primary-blue transition-colors">
                          (480) 933-4392
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary-blue p-3 rounded-full mr-4">
                      <Clock className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Hours</div>
                      <div className="text-gray-600">
                        Mon-Fri: 7:00 AM - 6:00 PM<br />
                        Saturday: 8:00 AM - 4:00 PM<br />
                        Sunday: Emergency Only
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary-blue p-3 rounded-full mr-4">
                      <Mail className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Email</div>
                      <div className="text-gray-600">info@windowsandnearme.com</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-success-green text-white border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="mr-3 h-4 w-4" />
                    Free estimates & consultations
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-3 h-4 w-4" />
                    Licensed & insured professionals
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-3 h-4 w-4" />
                    Authorized Milgard & Pella dealer
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-3 h-4 w-4" />
                    15+ years of experience
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-3 h-4 w-4" />
                    Warranty on all installations
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Contact Form */}
          <Card className="bg-gray-50 border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Request Your Free Estimate</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 mb-2">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 mb-2">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(480) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="serviceNeeded" className="text-sm font-semibold text-gray-700 mb-2">Service Needed</Label>
                  <Select value={formData.serviceNeeded} onValueChange={(value) => handleInputChange('serviceNeeded', value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Window Installation">Window Installation</SelectItem>
                      <SelectItem value="Door Installation">Door Installation</SelectItem>
                      <SelectItem value="Window Replacement">Window Replacement</SelectItem>
                      <SelectItem value="Door Replacement">Door Replacement</SelectItem>
                      <SelectItem value="Window Repair">Window Repair</SelectItem>
                      <SelectItem value="Door Repair">Door Repair</SelectItem>
                      <SelectItem value="Consultation Only">Consultation Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="projectDetails" className="text-sm font-semibold text-gray-700 mb-2">Project Details</Label>
                  <Textarea
                    id="projectDetails"
                    rows={4}
                    placeholder="Tell us about your project..."
                    value={formData.projectDetails || ""}
                    onChange={(e) => handleInputChange('projectDetails', e.target.value)}
                    className="bg-white"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="w-full bg-primary-blue text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
                >
                  {contactMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send My Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
