import  WhyUsSection from "@/components/layout/sections/whyUs";
import  ContactSection  from "@/components/layout/sections/contact";
import  DownloadSection  from "@/components/layout/sections/download";
import  FAQSection  from "@/components/layout/sections/faq";
import  FeaturesSection  from "@/components/layout/sections/features";
import  FooterSection  from "@/components/layout/sections/footer";
import  HeroSection from "@/components/layout/sections/hero";
import  ImageInfoSection  from "@/components/layout/sections/ImageInfo";
import  RatesSection  from "@/components/layout/sections/rates";
import  HowSection  from "@/components/layout/sections/how";
import  MethodsSection  from "@/components/layout/sections/methods";

export const metadata = {
  title: "OTPay",
  description:
    "Fast, secure money transfers across West Africa. Send by card or bank, receive by mobile money or bank account.",
  openGraph: {
    type: "website",
    url: "https://otpay.com",
    title: "OTPay . Send Money to Togo, Nigeria, Benin & Ghana",
    description:
      "Fast, secure money transfers across West Africa. Send by card or bank, receive by mobile money or bank account.",
    images: [
      {
        url: "/otpay-logo.png",
        width: 1200,
        height: 630,
        alt: "OTPay . Send money across West Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://otpay.com",
    title: "OtPay . Send Money to Togo, Nigeria, Benin & Ghana",
    description:
      "Fast, secure money transfers across West Africa. Send by card or bank, receive by mobile money or bank account.",
    images: ["/otpay-logo.png"],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <RatesSection />
      <ImageInfoSection />
      <MethodsSection />
      <WhyUsSection />
      <FeaturesSection />
      <HowSection />
      <DownloadSection />
      <ContactSection />
      <FAQSection />
      <FooterSection />
    </>
  );
}
