import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";

export default function FooterSection() {
  return (
    <footer id="footer" className="container py-24 sm:py-32">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <Link href="/" className="flex font-bold items-center gap-2">
              <Image
                src="/otpay-logo.png"
                alt="OtiPay logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <h3 className="text-2xl">OTPay</h3>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Licensed money transmitter serving Togo, Nigeria, Benin, and
              Ghana.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Contact</h3>
            <div>
              <Link href="#contact" className="opacity-60 hover:opacity-100">
                Support
              </Link>
            </div>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                WhatsApp
              </Link>
            </div>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Facebook
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Get the App</h3>
            <div>
              <Link
                href="https://apps.apple.com/app/otipay"
                target="_blank"
                className="opacity-60 hover:opacity-100"
              >
                iOS
              </Link>
            </div>
            <div>
              <Link
                href="https://play.google.com/store/apps/details?id=com.otipay"
                target="_blank"
                className="opacity-60 hover:opacity-100"
              >
                Android
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Help</h3>
            <div>
              <Link href="#contact" className="opacity-60 hover:opacity-100">
                Contact Us
              </Link>
            </div>
            <div>
              <Link href="#faq" className="opacity-60 hover:opacity-100">
                FAQ
              </Link>
            </div>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Feedback
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Legal</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Terms of Service
              </Link>
            </div>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Privacy Policy
              </Link>
            </div>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Licensing
              </Link>
            </div>
          </div>
        </div>
        <Separator className="my-6" />
        <section>
          <h3 className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} OTPay. All rights reserved.
          </h3>
        </section>
      </div>
    </footer>
  );
};
