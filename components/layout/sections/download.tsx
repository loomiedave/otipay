import { Button } from "@/components/ui/button";
import { Apple, PlayCircle, QrCode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DownloadSection () {
  return (
    <section id="download" className=" py-24 sm:py-32">
      <div className="relative overflow-hidden bg-brand-ink px-8 py-16 text-white md:px-16">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-coral/20 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <h2 className="text-lg text-brand-gold mb-2 tracking-wider">
              Get the App
            </h2>
            <h2 className="text-3xl md:text-4xl font-bold max-w-lg">
              Your Next Transfer Is One Tap Away
            </h2>

            <p className="text-lg text-white/70 max-w-md">
              Download OTPay and send money to Togo, Nigeria, Benin, and
              Ghana in minutes, right from your phone.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button size="lg" className="font-semibold" asChild>
                <Link href="https://apps.apple.com/app/otipay" target="_blank">
                  <Apple className="size-5 mr-2" />
                  App Store
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-semibold border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link
                  href="https://play.google.com/store/apps/details?id=com.otipay"
                  target="_blank"
                >
                  <PlayCircle className="size-5 mr-2" />
                  Google Play
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex size-24 items-center justify-center  bg-white">
                {/* Replace with a real QR code pointing to your app/download link */}
                <Image
                  src="/qr.png"
                  alt="Scan to download OtiPay"
                  width={96}
                  height={96}
                  className="rounded-lg"
                />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <QrCode className="size-4 text-brand-gold" />
                  Scan to download
                </p>
                <p className="mt-1 text-xs text-white/50 max-w-[140px]">
                  Point your camera at the code to get OtiPay instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
