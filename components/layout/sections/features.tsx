import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface FeaturesProps {
  icon: string;
  title: string;
  description: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: "Wallet",
    title: "Multi-Currency Wallet",
    description:
      "Hold and manage XOF, NGN, and GHS balances in one app, no separate accounts needed.",
  },
  {
    icon: "Radar",
    title: "Live Transfer Tracking",
    description:
      "Watch your transfer move in real time, from sent to confirmed in the recipient's account.",
  },
  {
    icon: "RotateCcwClock",
    title: "Full Transaction History",
    description:
      "Every transfer, rate, and fee logged and searchable to download anytime.",
  },
  {
    icon: "FingerprintPattern",
    title: "Biometric Security",
    description:
      "Face ID and fingerprint login keep your account locked down without slowing you down.",
  },
  {
    icon: "BellRing",
    title: "Instant Notifications",
    description:
      "Get notified the immediately a transfer is sent, confirmed, or received .",
  },
  {
    icon: "MessageCircle",
    title: "In-App Support",
    description:
      "Reach a real person in the app if a transfer needs help , we have 24/7 customer service",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <div className="max-w-2xl mb-16">
        <p className="text-sm font-medium text-primary mb-3 tracking-wide">
          Features
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Everything you need, in one app
        </h2>
        <p className="text-lg text-muted-foreground">
          OtiPay is built to make sending money across borders feel as easy
          as texting a friend.
        </p>
      </div>

      <div className="border-t border-border">
        {featureList.map(({ title, description }, i) => (
          <div
            key={title}
            className="grid sm:grid-cols-[240px_1fr] gap-2 sm:gap-8 py-6 border-b border-border"
          >
            <h3 className="font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
