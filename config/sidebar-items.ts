import { Calendar, Earth, LucideIcon, Users } from "lucide-react";

type SidebarItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const sidebarItems: SidebarItemType[] = [
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
    title: "Teams",
    url: "/teams",
    icon: Users,
  },
];
