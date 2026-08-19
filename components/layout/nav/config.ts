interface RouteProps {
  href: string;
  label: string;
}

interface FeatureProps {
  title: string;
  description: string;
}

export const routeList: RouteProps[] = [
  {
    href: "#benefits",
    label: "Why OtiPay",
  },
  {
    href: "#rates",
    label: "Live Rates",
  },
  {
    href: "#info",
    label: "Info",
  },

  {
    href: "#faq",
    label: "FAQ",
  },
];

export const featureList: FeatureProps[] = [
  {
    title: "Send in Minutes",
    description: "Transfers reach mobile money or bank accounts fast.",
  },
  {
    title: "Transparent Fees",
    description: "See the exact rate and fee before you send, every time.",
  },
  {
    title: "Licensed & Secure",
    description: "Regulated money transmitter with encrypted transfers.",
  },
];
