import  BenefitsSection from "@/components/layout/sections/benefits";
import  ContactSection  from "@/components/layout/sections/contact";
import  DownloadSection  from "@/components/layout/sections/download";
import  FAQSection  from "@/components/layout/sections/faq";
import  FeaturesSection  from "@/components/layout/sections/features";
import  FooterSection  from "@/components/layout/sections/footer";
import  HeroSection from "@/components/layout/sections/hero";
import  ImageInfoSection  from "@/components/layout/sections/ImageInfo";
import  RatesSection  from "@/components/layout/sections/rates";
import  ServicesSection  from "@/components/layout/sections/services";
import  SponsorsSection  from "@/components/layout/sections/sponsors";

export const metadata = {
  title: "OtPay",
  description:
    "Fast, secure money transfers across West Africa. Send by card or bank, receive by mobile money or bank account.",
  openGraph: {
    type: "website",
    url: "https://otpay.com",
    title: "OtPay — Send Money to Togo, Nigeria, Benin & Ghana",
    description:
      "Fast, secure money transfers across West Africa. Send by card or bank, receive by mobile money or bank account.",
    images: [
      {
        url: "https://otpay.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OtPay — Send money across West Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://otpay.com",
    title: "OtPay — Send Money to Togo, Nigeria, Benin & Ghana",
    description:
      "Fast, secure money transfers across West Africa. Send by card or bank, receive by mobile money or bank account.",
    images: ["https://otpay.com/og-image.jpg"],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <RatesSection />
      <ImageInfoSection />
      <SponsorsSection />
      <BenefitsSection />
      <FeaturesSection />
      <ServicesSection />
      <DownloadSection />
      <ContactSection />
      <FAQSection />
      <FooterSection />
    </>
  );
}
