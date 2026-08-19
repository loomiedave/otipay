import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface BenefitsProps {
  icon: string;
  title: string;
  description: string;
}

const benefitList: BenefitsProps[] = [
  {
    icon: "Zap",
    title: "Arrives in Minutes",
    description:
      "Most transfers to mobile money land in under 2 minutes. Bank transfers typically clear same-day, not in 3-5 business days.",
  },
  {
    icon: "PiggyBank",
    title: "Transparent Fees",
    description:
      "See the exact fee and exchange rate before you send — no hidden markups added at the last step.",
  },
  {
    icon: "ShieldCheck",
    title: "Licensed & Secure",
    description:
      "Every transfer is encrypted and monitored for fraud. OtiPay operates as a licensed money transmitter in every corridor we serve.",
  },
  {
    icon: "Smartphone",
    title: "Any Way You Pay",
    description:
      "Send by card or bank transfer. Recipients receive funds directly to mobile money or their bank account — whichever works for them.",
  },
];

export default function BenefitsSection () {
  return (
    <section id="benefits" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div>
          <h2 className="text-lg text-primary mb-2 tracking-wider">Why OtiPay</h2>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Send Money Home, Without the Wait
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Built for the way money actually moves between Togo, Nigeria,
            Benin, and Ghana — fast, transparent, and secure at every step.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 w-full">
          {benefitList.map(({ icon, title, description }, index) => (
            <Card
              key={title}
              className="bg-muted/50 dark:bg-card hover:bg-background hover:border-primary/40 transition-all delay-75 group/number"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={32}
                    color="hsl(var(--primary))"
                    className="mb-6 text-primary"
                  />
                  <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                    0{index + 1}
                  </span>
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
