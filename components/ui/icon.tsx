import { icons, HelpCircle } from "lucide-react";

export const Icon = ({
  name,
  color,
  size,
  className,
}: {
  name: keyof typeof icons;
  color: string;
  size: number;
  className?: string;
}) => {
  const LucideIcon = icons[name as keyof typeof icons] || HelpCircle;

  if (!icons[name as keyof typeof icons]) {
    console.warn(`[Icon] Missing icon: "${name}"`);
  }

  return <LucideIcon color={color} size={size} className={className} />;
};
