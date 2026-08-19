import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });

interface WhyUsProps {
  icon: string;
  title: string;
  description: string;
  stat: string;
}

const whyUsList: WhyUsProps[] = [
  {
    icon: "Zap",
    title: "Arrives in Minutes",
    description:
      "Most transfers to mobile money land in under 2 minutes. Bank transfers typically clear same-day, not in 3-5 business days.",
    stat: "< 2 min transfer time",
  },
  {
    icon: "PiggyBank",
    title: "Transparent Fees",
    description:
      "See the exact fee and exchange rate before you send, no hidden markups added at the last step.",
    stat: "0% hidden markup",
  },
  {
    icon: "ShieldCheck",
    title: "Licensed & Secure",
    description:
      "Every transfer is encrypted and monitored for fraud. OTPay operates as a licensed money transmitter in every corridor we serve.",
    stat: "Licensed money transmitter",
  },
  {
    icon: "Smartphone",
    title: "Any Way You Pay",
    description:
      "Send by card or bank transfer. Recipients receive funds directly to mobile money or their bank account, whichever works for them.",
    stat: "2 payout methods",
  },
];

export default function WhyUsSection() {
  return (
    <section id="benefits" className="border-t border-border">
      <div className="container py-24 sm:py-32">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-16 lg:gap-20">
          {/* Left: copy */}
          <div>
            <p className="text-sm font-medium text-primary mb-3 tracking-wide">
              Why OtiPay
            </p>
            <h2
              className={`${spaceGrotesk.className} text-3xl md:text-4xl font-bold mb-4 leading-tight`}
            >
              Send money home,
              <br />
              without the wait
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Built for the way money actually moves between Togo, Nigeria,
              Benin, and Ghana, fast, transparent, and secure at every step.
            </p>
          </div>

          {/* Right: benefit grid */}
          <div className="grid sm:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {whyUsList.map(({ icon, title, description, stat }) => (
              <Card
                key={title}
                className="rounded-none border-0 bg-card hover:bg-secondary/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={22}
                    color="hsl(var(--primary))"
                    className="mb-4"
                  />
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                  <p className="text-xs font-medium text-foreground/70 border-t border-border pt-3">
                    {stat}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
