import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async (planType: string) => {
    setIsUpgrading(true);
    try {
      // Future: Integrate with Stripe for payment processing
      toast({
        title: "Upgrade Initiated",
        description: `Redirecting to payment for ${planType} plan...`,
      });
      
      // For now, show message that Stripe integration is needed
      setTimeout(() => {
        toast({
          title: "Payment Integration Required",
          description: "Stripe integration needed for payment processing. Contact support to upgrade manually.",
          variant: "destructive",
        });
        setIsUpgrading(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
  };

  const getTrialDaysRemaining = () => {
    if (user?.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, daysRemaining);
    }
    return 0;
  };

  const plans = [
    {
      name: "Customer",
      price: "Free",
      description: "Basic project tracking for homeowners",
      features: [
        "View your projects",
        "Basic project updates",
        "Contact support",
        "Mobile access"
      ],
      current: user?.subscriptionType === "free",
      disabled: user?.subscriptionType === "free"
    },
    {
      name: "Contractor Trial",
      price: "Free for 30 days",
      description: "Full contractor features with trial period",
      features: [
        "Everything in Customer",
        "Create and manage projects",
        "Client management",
        "Employee assignment",
        "Consultation scheduling",
        "Project task management"
      ],
      current: user?.subscriptionType === "trial",
      disabled: user?.subscriptionType === "trial" || user?.subscriptionType === "paid",
      trialInfo: user?.subscriptionType === "trial" ? `${getTrialDaysRemaining()} days remaining` : null
    },
    {
      name: "Contractor Pro",
      price: "$29/month",
      description: "Full contractor features with premium tools",
      features: [
        "Everything in Trial",
        "Advanced reporting",
        "Priority support",
        "Custom branding",
        "API access",
        "Unlimited projects",
        "Team collaboration tools",
        "Export capabilities"
      ],
      current: user?.subscriptionType === "paid",
      disabled: false,
      recommended: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Select the perfect plan for your business needs. Upgrade or downgrade anytime.
        </p>
        
        {user?.subscriptionType === "trial" && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-md mx-auto">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Your trial expires in {getTrialDaysRemaining()} days
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Upgrade now to continue accessing contractor features
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card key={index} className={`relative ${plan.recommended ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  <Crown className="h-4 w-4 mr-1" />
                  Recommended
                </Badge>
              </div>
            )}
            
            {plan.current && (
              <div className="absolute -top-4 right-4">
                <Badge variant="secondary" className="bg-green-500 text-white">
                  Current Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold flex items-center justify-center">
                {plan.name === "Customer" && <Users className="h-5 w-5 mr-2 text-gray-500" />}
                {plan.name === "Contractor Trial" && <Star className="h-5 w-5 mr-2 text-blue-500" />}
                {plan.name === "Contractor Pro" && <Crown className="h-5 w-5 mr-2 text-yellow-500" />}
                {plan.name}
              </CardTitle>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {plan.price}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              
              {plan.trialInfo && (
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {plan.trialInfo}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.current ? "outline" : "default"}
                disabled={plan.disabled || isUpgrading}
                onClick={() => handleUpgrade(plan.name)}
              >
                {plan.current ? "Current Plan" : 
                 plan.disabled ? "Unavailable" : 
                 plan.name === "Contractor Pro" ? "Upgrade Now" : "Start Trial"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Need help choosing? <Button variant="link" className="p-0 h-auto">Contact our sales team</Button>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          All plans include 24/7 support and 99.9% uptime guarantee
        </p>
      </div>
    </div>
  );
}