import {
  Calendar,
  Earth,
  Globe,
  LucideIcon,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";

type SidebarItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const sidebarItems: SidebarItemType[] = [
  {
    title: "Timezones",
    url: "/timezones",
    icon: Globe,
  },
  {
    title: "Countries",
    url: "/countries",
    icon: Earth,
  },
  {
    title: "Seasons",
    url: "/seasons",
    icon: Calendar,
  },
  {
    title: "Venues",
    url: "/venues",
    icon: MapPin,
  },
  {
    title: "Leagues",
    url: "/leagues",
    icon: Trophy,
  },
  {
    title: "Teams",
    url: "/teams",
    icon: Users,
  },
];
