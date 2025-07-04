import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Link } from "wouter";

export default function ServiceAreas() {
  const areas = [
    { name: "Gilbert", link: "/gilbert-windows-doors" },
    { name: "Mesa", link: "/mesa-windows-doors" }, 
    { name: "Chandler", link: "/chandler-windows-doors" },
    { name: "Tempe", link: "/tempe-windows-doors" },
    { name: "Scottsdale", link: "/scottsdale-windows-doors" },
    { name: "Queen Creek", link: "/queen-creek-windows-doors" }
  ];

  return (
    <section className="py-12 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">Service Areas</h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Proudly serving Gilbert and surrounding Arizona communities with professional 
            window and door installation services.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {areas.map((area, index) => (
            <Link key={index} href={area.link}>
              <Card className="bg-card border hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
                <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                  <MapPin className="text-primary text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-3 mx-auto" />
                  <div className="font-semibold text-card-foreground text-sm sm:text-base">{area.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Click for local services</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
