import { Card, CardContent } from "@/components/ui/card";
import { Star, User } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Gilbert, AZ",
      text: "Excellent work! The team was professional, punctual, and the installation was flawless. Our new Milgard windows have made such a difference in our energy bills."
    },
    {
      name: "Mike Rodriguez",
      location: "Mesa, AZ",
      text: "From consultation to installation, everything was top-notch. The Pella doors we chose look amazing and the installation team was incredibly clean and efficient."
    },
    {
      name: "Lisa Chen",
      location: "Chandler, AZ",
      text: "Best decision we made for our home renovation. The quality of work exceeded our expectations and the customer service was outstanding throughout the entire process."
    }
  ];

  return (
    <section className="py-20 bg-primary-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what homeowners in Gilbert say about our work.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-0">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-blue-100 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <User className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-blue-200 text-sm">{testimonial.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
