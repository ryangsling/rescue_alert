/**
 * Rescue UI icon set. design/DESIGN.md section 9 "Recommended
 * operational icons" - one family (Lucide), re-exported under names
 * matching DESIGN.md's own labels so feature code never imports
 * lucide-react-native directly. Icon names below are verified
 * against the installed lucide-react-native version, not assumed.
 */
export {
  MapPin as LocationPinIcon,
  Navigation as NavigationArrowIcon,
  Camera as CameraIcon,
  Image as ImageIcon,
  Bell as BellIcon,
  AlertTriangle as AlertTriangleIcon,
  HeartPulse as HeartPulseIcon,
  Ambulance as TransportIcon,
  Home as FosterIcon,
  Hospital as ClinicIcon,
  MessageCircle as MessageIcon,
  Users as RespondersIcon,
  ShieldCheck as VerifiedIcon,
  Clock as ClockIcon,
  CheckCircle2 as CheckCircleIcon,
  EyeOff as PrivateIcon,
} from "lucide-react-native";

export type { LucideIcon, LucideProps } from "lucide-react-native";
