"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export interface ColumnTestimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

function RoseStars() {
  return (
    <div className="flex gap-0.5 mb-3" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="text-primary"
          style={{ color: "hsl(var(--primary))", filter: "drop-shadow(0 0 2px rgba(232,175,193,0.4))" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

interface TestimonialsColumnProps {
  className?: string;
  testimonials: ColumnTestimonial[];
  duration?: number;
}

export const TestimonialsColumn = (props: TestimonialsColumnProps) => {
  const { className, testimonials, duration } = props;

  return (
    <div className={className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="p-6 md:p-8 rounded-3xl border border-primary/10 shadow-[0_8px_32px_rgba(232,175,193,0.12)] max-w-xs w-full bg-card/85 backdrop-blur-md dark:bg-card/80"
                  key={name + role + i}
                >
                  <Quote className="h-8 w-8 text-primary/70 mb-3" aria-hidden />
                  <RoseStars />
                  <div className="text-sm md:text-base leading-relaxed text-muted-foreground">
                    {text}
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5 text-sm md:text-base">
                        {name}
                      </div>
                      <div className="leading-5 opacity-60 tracking-tight text-xs md:text-sm">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

