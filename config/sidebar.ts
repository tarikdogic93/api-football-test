import {
  Building,
  Calendar,
  Earth,
  Globe,
  LucideIcon,
  ShieldUser,
  Trophy,
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
    icon: Building,
  },
  {
    title: "Leagues",
    url: "/leagues",
    icon: Trophy,
  },
  {
    title: "Teams",
    url: "/teams",
    icon: ShieldUser,
  },
];
