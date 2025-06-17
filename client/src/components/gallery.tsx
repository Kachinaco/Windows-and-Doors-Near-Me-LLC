import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Images } from "lucide-react";

export default function Gallery() {
  const projects = [
    {
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "Modern Bay Window Installation",
      description: "Complete bay window replacement in Gilbert home",
      location: "Gilbert, AZ"
    },
    {
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "Sliding Patio Door Upgrade",
      description: "Energy-efficient Pella sliding door installation",
      location: "Mesa, AZ"
    },
    {
      image: "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "Contemporary Front Door",
      description: "Custom Milgard entry door with sidelights",
      location: "Chandler, AZ"
    },
    {
      image: "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "Whole Home Window Replacement",
      description: "15 windows replaced with energy-efficient Milgard",
      location: "Tempe, AZ"
    },
    {
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "Commercial Storefront",
      description: "Large commercial window installation project",
      location: "Gilbert, AZ"
    },
    {
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "Custom Design Installation",
      description: "Unique window configuration for modern home",
      location: "Scottsdale, AZ"
    }
  ];

  return (
    <section id="gallery" className="py-20 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Our Work Gallery</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See the quality of our installations and the transformation we bring to homes across Gilbert, Arizona.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card key={index} className="bg-card border overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img 
                src={project.image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-card-foreground mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4">{project.description}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {project.location}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button className="px-8 py-4 font-semibold text-lg">
            <Images className="mr-2 h-5 w-5" />
            View Complete Gallery
          </Button>
        </div>
      </div>
    </section>
  );
}
