import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b8?w=800&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
  "https://images.unsplash.com/photo-1478146896989-b14fe3253e89?w=800&q=80",
] as const;

function Hero() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline">We&apos;re live!</Badge>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-lg text-left text-5xl font-regular tracking-tighter md:text-7xl">
                This is the start of something!
              </h1>
              <p className="max-w-md text-left text-xl leading-relaxed tracking-tight text-muted-foreground">
                Managing a small business today is already tough. Avoid further
                complications by ditching outdated, tedious trade methods. Our
                goal is to streamline SMB trade, making it easier and faster than
                ever.
              </p>
            </div>
            <div className="flex flex-row gap-4">
              <Button size="lg" className="gap-4" variant="outline">
                Jump on a call <PhoneCall className="h-4 w-4" />
              </Button>
              <Button size="lg" className="gap-4">
                Sign up here <MoveRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <AspectRatio ratio={1} className="overflow-hidden rounded-md">
              <img
                src={DEFAULT_IMAGES[0]}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </AspectRatio>
            <AspectRatio ratio={3 / 4} className="row-span-2 overflow-hidden rounded-md">
              <img
                src={DEFAULT_IMAGES[1]}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </AspectRatio>
            <AspectRatio ratio={1} className="overflow-hidden rounded-md">
              <img
                src={DEFAULT_IMAGES[2]}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </AspectRatio>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
