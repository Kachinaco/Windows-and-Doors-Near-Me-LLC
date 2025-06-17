import { Card, CardContent } from "@/components/ui/card";
import { IdCard, Shield } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-20 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-6">About Windows & Doors Near Me LLC</h2>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Serving Gilbert, Arizona and surrounding communities for over 15 years, we've built our reputation 
              on quality craftsmanship, reliable service, and customer satisfaction.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              As an authorized dealer of Milgard and Pella products, we offer the finest windows and doors 
              available, backed by comprehensive warranties and expert installation. Our team of certified 
              professionals takes pride in every project, ensuring your home receives the quality it deserves.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">15+</div>
                <div className="text-muted-foreground">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">Licensed & Insured</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">5.0</div>
                <div className="text-muted-foreground">Average Rating</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Card className="bg-card border">
                <CardContent className="flex items-center p-4">
                  <IdCard className="text-primary text-2xl mr-3" />
                  <span className="font-semibold text-card-foreground">Licensed Contractors</span>
                </CardContent>
              </Card>
              <Card className="bg-card border">
                <CardContent className="flex items-center p-4">
                  <Shield className="text-green-600 text-2xl mr-3" />
                  <span className="font-semibold text-card-foreground">Fully Insured</span>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Professional installation team at work" 
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
