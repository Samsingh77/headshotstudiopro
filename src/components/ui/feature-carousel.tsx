import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

// --- TYPES ---
interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  subtitle: string;
  images?: { src: string; alt: string; }[];
  actions?: React.ReactNode;
}

// --- HERO SECTION COMPONENT ---
export const HeroSection = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ title, subtitle, images = [], actions, className, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(Math.floor(images.length / 2));

    const handleNext = React.useCallback(() => {
      if (images.length === 0) return;
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, [images.length]);

    const handlePrev = () => {
      if (images.length === 0) return;
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };
    
    React.useEffect(() => {
        if (images.length === 0) return;
        const timer = setInterval(() => {
            handleNext();
        }, 4000);
        return () => clearInterval(timer);
    }, [handleNext, images.length]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full max-w-full flex flex-col items-center justify-center overflow-hidden bg-background text-foreground p-4',
          images.length > 0 ? 'min-h-screen' : 'pt-20 pb-10',
          className
        )}
        {...props}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 opacity-20" aria-hidden="true">
            <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(128,90,213,0.3),rgba(255,255,255,0))]"></div>
            <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(0,123,255,0.3),rgba(255,255,255,0))]"></div>
        </div>

        {/* Content */}
        <div className="z-10 flex w-full flex-col items-center text-center space-y-6 md:space-y-8">
          {/* Header Section */}
          <div className="space-y-3">
            <h1 className="font-black tracking-tighter">
              {title}
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl">
              {subtitle}
            </p>
            {actions && <div className="pt-4 flex justify-center">{actions}</div>}
          </div>

          {/* Main Showcase Section */}
          {images.length > 0 && (
            <div className="relative w-full h-[350px] md:h-[450px] flex items-center justify-center">
              {/* Carousel Wrapper */}
              <div className="relative w-full h-full flex items-center justify-center [perspective:1000px]">
                {images.map((image, index) => {
                  const offset = index - currentIndex;
                  const total = images.length;
                  let pos = (offset + total) % total;
                  if (pos > Math.floor(total / 2)) {
                    pos = pos - total;
                  }

                  const isCenter = pos === 0;
                  const isAdjacent = Math.abs(pos) === 1;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'absolute w-44 h-64 sm:w-60 sm:h-96 md:w-80 md:h-[450px] transition-all duration-500 ease-in-out',
                        'flex items-center justify-center'
                      )}
                      style={{
                        transform: `
                          translateX(${(pos) * (typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : 45)}%) 
                          scale(${isCenter ? 1 : isAdjacent ? 0.85 : 0.7})
                          rotateY(${(pos) * -10}deg)
                        `,
                        zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                        opacity: isCenter ? 1 : isAdjacent ? 0.4 : 0,
                        filter: isCenter ? 'blur(0px)' : 'blur(4px)',
                        visibility: Math.abs(pos) > 1 ? 'hidden' : 'visible',
                      }}
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="object-cover w-full h-full rounded-3xl border-2 border-foreground/10 shadow-2xl"
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 z-20 bg-background/50 backdrop-blur-sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 z-20 bg-background/50 backdrop-blur-sm"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';
