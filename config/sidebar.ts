import {
  Calendar,
  Clock,
  Earth,
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
    icon: Clock,
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
