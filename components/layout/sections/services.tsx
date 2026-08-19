import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StepProps {
  step: string;
  title: string;
  description: string;
}

const stepList: StepProps[] = [
  {
    step: "01",
    title: "Enter the Amount",
    description:
      "Choose how much to send and where it's going — Togo, Nigeria, Benin, or Ghana.",
  },
  {
    step: "02",
    title: "Pay Your Way",
    description:
      "Fund the transfer with your card or bank account. See the exact rate and fee upfront.",
  },
  {
    step: "03",
    title: "They Get Notified",
    description:
      "Your recipient gets an instant alert the moment funds are on the way.",
  },
  {
    step: "04",
    title: "Funds Land Fast",
    description:
      "Mobile money arrives in minutes. Bank payouts typically clear the same day.",
  },
];

export default function ServicesSection () {
  return (
    <section id="services" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        How It Works
      </h2>
      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Four Steps to Sent
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        No branch visits, no paperwork — just open the app and send.
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stepList.map(({ step, title, description }) => (
          <Card key={step} className="bg-muted/60 dark:bg-card h-full relative">
            <CardHeader>
              <span className="text-4xl font-bold text-primary/30 mb-2 block">
                {step}
              </span>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
};
