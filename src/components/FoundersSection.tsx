import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Lightbulb, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

import avanthikaImg from "@/assets/founders/avanthika.jpeg";
import bhavishyaImg from "@/assets/founders/bhavishya.jpeg";
import aswiniImg from "@/assets/founders/aswini.jpeg";

const founders = [
  {
    name: "AVANTHIKA J",
    role: "Founder",
    image: avanthikaImg,
    quote: "Empowering students to discover their true potential through technology.",
    linkedin: "https://www.linkedin.com/in/avanthika-j-53a45a33a",
  },
  {
    name: "ASWINI E",
    role: "Founder",
    image: aswiniImg,
    quote: "Creating a community where knowledge sharing transforms lives.",
    linkedin: "https://www.linkedin.com/in/aswiniprofileurl",
  },
  {
    name: "BHAVISHYA L",
    role: "Founder",
    image: bhavishyaImg,
    quote: "Building bridges between learning and career success.",
    linkedin: "https://www.linkedin.com/in/bhavishya-l-a2ab14331",
  },
];

const FoundersSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % founders.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + founders.length) % founders.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % founders.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 bg-muted/50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Vision Behind PrepVerse</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Meet Our Founders</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three passionate individuals united by a shared dream to revolutionize student learning
          </p>
        </div>

        {/* Desktop View - All cards visible */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {founders.map((founder, index) => (
            <Card
              key={index}
              className="p-6 bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-1">{founder.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{founder.role}</p>
                <p className="text-muted-foreground italic text-sm">"{founder.quote}"</p>
                <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile View - Carousel */}
        <div className="md:hidden relative">
          <div className="flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Cards Container */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {founders.map((founder, index) => (
                    <div key={index} className="w-full flex-shrink-0 px-4">
                      <Card className="p-6 bg-card shadow-card">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-28 h-28 rounded-full overflow-hidden mb-4 ring-4 ring-primary/20">
                            <img
                              src={founder.image}
                              alt={founder.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-lg font-bold mb-1">{founder.name}</h3>
                          <p className="text-sm text-primary font-medium mb-3">{founder.role}</p>
                          <p className="text-muted-foreground italic text-sm">"{founder.quote}"</p>
                          <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
                onClick={goToNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {founders.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoundersSection;
