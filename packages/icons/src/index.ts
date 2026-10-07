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
  // Not in DESIGN.md's list, but needed for dismissible Banner/Toast/
  // Dialog/Sheet controls - verified to exist the same way as the rest.
  X as DismissIcon,
  // Not in DESIGN.md's list - needed for the empty/offline/error state
  // components (Part 5), same verification standard as the rest.
  Inbox as EmptyStateIcon,
  WifiOff as OfflineIcon,
  ServerCrash as ErrorIcon,
  Share2 as ShareIcon,
  Flag as ReportIcon,
  // Not in DESIGN.md's list - needed for Part 12's comment/reply
  // overflow menu and mention picker, same verification standard.
  MoreVertical as MoreIcon,
  AtSign as MentionIcon,
  Reply as ReplyIcon,
} from "lucide-react-native";

export type { LucideIcon, LucideProps } from "lucide-react-native";
