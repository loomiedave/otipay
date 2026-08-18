"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const corridor = [
  { code: "TG", city: "Accra" },
  { code: "NG", city: "Lomé" },
  { code: "BJ", city: "Cotonou" },
  { code: "GH", city: "Lagos" },
];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="container relative grid gap-16 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* Left: copy */}
        <div className="relative z-10 space-y-8">
          <h1
            className={`${spaceGrotesk.className} text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight`}
          >
            Send money
            <br />
            that lands
            <span className="relative inline-block px-2">
              <span className="relative z-10">today.</span>
              <span className="absolute inset-x-0 bottom-2 -z-0 h-3 bg-accent" />
            </span>
          </h1>

          <p className="max-w-md text-lg text-muted-foreground">
            OtiPay moves money across West Africa in minutes — straight to
            mobile money, a bank account, or paid by card. No branch visits,
            no waiting.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" className="font-semibold group/arrow" asChild>
              <Link href="https://apps.apple.com/app/otipay" target="_blank">
                Download for iOS
                <ArrowRight className="size-4 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="font-semibold" asChild>
              <Link
                href="https://play.google.com/store/apps/details?id=com.otipay"
                target="_blank"
              >
                Get it on Google Play
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" />
              Licensed money transfer
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              Trusted by thousands across West Africa
            </div>
          </div>
        </div>

        {/* Right: photo + signature corridor visual */}
        <div className="relative z-10">
          {/* Photo, offset behind the card */}
          <div className="relative mx-auto aspect-[4/5] px-95%] overflow-hidden rounded-[1rem] shadow-xl">
            <Image
              src="/heroimg.jpg"
              alt="Woman smiling while sending money home on her phone"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 80vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/40 via-transparent to-transparent" />
          </div>

          {/* Floating trust card, overlapping bottom-left of photo */}
          <div className="absolute -bottom-4 -left-4 z-20 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg md:-left-8">
            <div className="flex -space-x-2">
              <div className="size-8 rounded-full border-2 border-white bg-accent" />
              <div className="size-8 rounded-full border-2 border-white bg-brand-gold/60" />
              <div className="size-8 rounded-full border-2 border-white bg-brand-coral/60" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">1,000+</p>
              <p className="text-xs text-muted-foreground leading-tight">
                over active customers
              </p>
            </div>
          </div>

          {/* Corridor / rate card, overlapping top-right of photo */}
          <div className="absolute -top-6 -right-2 z-20 w-[78%] rounded-3xl bg-brand-ink p-6 text-white shadow-2xl md:-right-6 md:w-[70%]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              Transfer route
            </p>

            <div className="relative mt-6 flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
              {corridor.map((stop) => (
                <div
                  key={stop.code}
                  className="relative flex flex-col items-center gap-1.5"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[10px] font-semibold">
                    {stop.code}
                  </div>
                  <span className="text-[10px] text-white/60">{stop.city}</span>
                </div>
              ))}
              <div className="corridor-dot absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-brand-coral shadow-[0_0_12px_2px_hsl(var(--brand-coral)/60%)]" />
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <div>
                <p className="text-[11px] text-white/50">You send</p>
                <p className={`${spaceGrotesk.className} text-lg font-semibold`}>
                  ₵ 200.00
                </p>
              </div>
              <ArrowRight className="size-4 text-white/40" />
              <div className="text-right">
                <p className="text-[11px] text-white/50">They receive</p>
                <p className={`${spaceGrotesk.className} text-lg font-semibold text-brand-gold`}>
                  ₦ 148,300
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 -z-10 h-40 w-40 rounded-full bg-brand-gold/30 blur-3xl" />
          <div className="absolute -top-6 -right-6 -z-10 h-40 w-40 rounded-full bg-brand-coral/20 blur-3xl" />
        </div>
      </div>

      <style jsx>{`
        .corridor-dot {
          animation: travel 6s ease-in-out infinite;
        }
        @keyframes travel {
          0% {
            left: 0%;
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          50% {
            left: 50%;
          }
          92% {
            left: 100%;
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .corridor-dot {
            animation: none;
            left: 100%;
          }
        }
      `}</style>
    </section>
  );
};
