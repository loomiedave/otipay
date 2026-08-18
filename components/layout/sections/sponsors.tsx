"use client";

import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface SponsorsProps {
  icon: string;
  name: string;
}

const sponsors: SponsorsProps[] = [
  { icon: "Smartphone", name: "MTN Mobile Money" },
  { icon: "Wallet", name: "Moov Money" },
  { icon: "Landmark", name: "Bank Transfer" },
  { icon: "CreditCard", name: "Visa" },
  { icon: "CreditCard", name: "Mastercard" },
  { icon: "ShieldCheck", name: "Licensed Money Transmitter" },
];

export const SponsorsSection = () => {
  return (
    <section id="sponsors" className="max-w-[75%] mx-auto pb-24 sm:pb-32">
      <h2 className="text-lg md:text-xl text-center mb-6">
        Send and Receive However You Prefer
      </h2>

      <div className="relative overflow-hidden">
        {/* Edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

        <div className="flex w-max animate-sponsors-marquee hover:[animation-play-state:paused]">
          {[...sponsors, ...sponsors].map(({ icon, name }, index) => (
            <div
              key={`${name}-${index}`}
              className="flex items-center text-xl md:text-2xl font-medium mr-[3rem]"
            >
              <Icon
                name={icon as keyof typeof icons}
                size={32}
                color="hsl(var(--primary))"
                className="mr-2 shrink-0"
              />
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
