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
      "Every transfer, rate, and fee logged and searchable — download statements anytime.",
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
      "Get notified the moment a transfer is sent, confirmed, or received — no guessing.",
  },
  {
    icon: "MessageCircle",
    title: "In-App Support",
    description:
      "Reach a real person in the app if a transfer needs help — no separate hotline to find.",
  },
];

export default function FeaturesSection () {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Features
      </h2>
      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Everything You Need, In One App
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        OtiPay is built to make sending money across borders feel as easy as
        texting a friend.
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ icon, title, description }) => (
          <div key={title}>
            <Card className="h-full bg-background border-0 shadow-none">
              <CardHeader className="flex justify-center items-center">
                <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={24}
                    color="hsl(var(--primary))"
                    className="text-primary"
                  />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-center">
                {description}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};
