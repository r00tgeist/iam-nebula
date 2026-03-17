import type { LucideProps } from "lucide-react";
import {
  Activity, AlertTriangle, ArrowUp, Award, Bell, Bot, CheckCircle,
  ClipboardCheck, Clock, Cloud, Code, Cpu, Crown, Database,
  ExternalLink, FileJson, FileText, Fingerprint, GitBranch, Globe,
  Grid3x3, Handshake, Hash, Key, KeyRound, Lock, LogIn, Map,
  MessageSquare, Minimize2, Monitor, Network, RefreshCw, ScanEye,
  Server, Settings, Shield, ShieldCheck, SlidersHorizontal,
  Smartphone, Split, Square, Tag, Target, Timer, Usb, User,
  UserCheck, UserMinus, UserPlus, Users, Video, XCircle, Zap,
} from "lucide-react";
import { memo } from "react";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Activity, AlertTriangle, ArrowUp, Award, Bell, Bot, CheckCircle,
  ClipboardCheck, Clock, Cloud, Code, Cpu, Crown, Database,
  ExternalLink, FileJson, FileText, Fingerprint, GitBranch, Globe,
  Grid3x3, Handshake, Hash, Key, KeyRound, Lock, LogIn, Map,
  MessageSquare, Minimize2, Monitor, Network, RefreshCw, ScanEye,
  Server, Settings, Shield, ShieldCheck, SlidersHorizontal,
  Smartphone, Split, Square, Tag, Target, Timer, Usb, User,
  UserCheck, UserMinus, UserPlus, Users, Video, XCircle, Zap,
};

interface LucideIconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const LucideIcon = memo(({ name, ...props }: LucideIconProps) => {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon {...props} />;
});

LucideIcon.displayName = "LucideIcon";

export default LucideIcon;
