"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface Corridor {
  code: string;
  country: string;
  currency: string;
  symbol: string;
  rate: number;
}

const corridors: Corridor[] = [
  { code: "NG", country: "Nigeria", currency: "NGN", symbol: "₦", rate: 1550 },
  { code: "GH", country: "Ghana", currency: "GHS", symbol: "₵", rate: 15.4 },
  { code: "TG", country: "Togo", currency: "XOF", symbol: "F CFA", rate: 610 },
  { code: "BJ", country: "Benin", currency: "XOF", symbol: "F CFA", rate: 610 },
];

function calculateFee(amount: number) {
  if (amount <= 0) return 0;
  if (amount < 100) return 1.5;
  return +(amount * 0.012).toFixed(2);
}

export default function RatesSection (){
  const [amount, setAmount] = useState<string>("200");
  const [corridorCode, setCorridorCode] = useState<string>("NG");

  const corridor = corridors.find((c) => c.code === corridorCode)!;
  const numericAmount = Number(amount) || 0;

  const fee = useMemo(() => calculateFee(numericAmount), [numericAmount]);
  const received = useMemo(() => {
    const net = Math.max(numericAmount - fee, 0);
    return net * corridor.rate;
  }, [numericAmount, fee, corridor.rate]);


  return (
    <section id="rates" className="container py-6 sm:py-6">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Live rates
      </h2>
      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        See Exactly What Arrives
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-12">
        No hidden markup on the rate. Enter an amount and see the real number
        before you send.
      </h3>

      <Card className="max-w-2xl mx-auto border-primary/20">
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            Transfer calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                You send (USD)
              </label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Recipient country
              </label>
              <Select value={corridorCode} onValueChange={setCorridorCode}>
                <SelectTrigger className="text-lg font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {corridors.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.country} ({c.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-ink p-6 text-white">
            <div className="flex items-center justify-between text-sm text-white/60 mb-2">
              <span>Our fee</span>
              <span>${fee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">They receive</span>
              <span className="text-2xl font-bold text-brand-gold">
                {corridor.symbol}{" "}
                {received.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
            Rates shown are indicative. The exact rate is locked in-app before
            you confirm a transfer.
          </p>

          <Button size="lg" className="w-full font-semibold" asChild>
            <Link href="#download">
              Download to Send This Transfer
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
