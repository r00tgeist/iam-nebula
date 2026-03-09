import { icons } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface LucideIconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const LucideIcon = ({ name, ...props }: LucideIconProps) => {
  const Icon = (icons as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Icon) return null;
  return <Icon {...props} />;
};

export default LucideIcon;
