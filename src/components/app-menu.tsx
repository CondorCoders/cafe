"use client";
import {
  ChevronUp,
  Clock,
  MessageCircle,
  Music,
  Shapes,
  UsersRound,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";
import { Button } from "./ui/button";
import { OnlineUsers } from "./sidebar-features/online-users";
import { useOnlineUsers } from "@/context/online-users-context";
import { GeneralChat } from "./sidebar-features/general-chat";
import { MusicPlayer } from "./sidebar-features/music-player";
import { Pomodoro } from "./sidebar-features/pomodoro";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { LogoutButton } from "./logout-button";

const menuItems = [
  { id: "online", label: "Online", icon: UsersRound },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

const tools = [
  { id: "music", label: "Música", icon: Music },
  { id: "pomodoro", label: "Pomodoro", icon: Clock },
];

export interface User {
  id: string;
  full_name: string;
  username: string;
  profile_url: string;
}

interface AppSidebarProps {
  user: User; // Permite null para pruebas locales sin auth
}

export const AppMenu = ({ user }: AppSidebarProps) => {
  const [activeMenuItem, setActiveMenuItem] = useState<
    string | undefined | null
  >();
  const { onlineUsers } = useOnlineUsers();

  const numberOfOnlineUsers = Object.keys(onlineUsers).length;

  return (
    <div className="absolute z-50 m-4 bottom-0 left-0 w-96">
      {activeMenuItem && (
        <div className="bg-indigo-950/90 w-full rounded-2xl mb-1 text-white relative max-h-96">
          <div className="w-full flex items-center px-3 py-1 justify-between border-b-[1px] border-gray-500">
            <h2 className="text-sm">
              {menuItems.find((item) => item.id === activeMenuItem)?.label}
            </h2>
            <Button
              variant="ghost"
              onClick={() => setActiveMenuItem(null)}
              className="hover:bg-indigo-300"
            >
              <X className="size-3" />
            </Button>
          </div>
          {activeMenuItem === "online" && <OnlineUsers />}
          {activeMenuItem === "chat" && <GeneralChat user={user} />}
          {activeMenuItem === "music" && <MusicPlayer />}
          {activeMenuItem === "pomodoro" && <Pomodoro />}
        </div>
      )}
      <div className="flex items-center justify-center p-3 py-2 rounded-2xl shadow-lg bg-indigo-950/70 hover:bg-indigo-950/100 transition-colors text-white backdrop-blur-md">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex hover:bg-indigo-300 rounded-md hover:text-indigo-950 items-center justify-center gap-2 hover:cursor-pointer px-1">
            <Avatar className="size-10">
              <AvatarImage src={user.profile_url} />
              <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            {user.full_name}
            <ChevronUp className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-full">
            <DropdownMenuItem>
              <LogoutButton className="w-full" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {menuItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="hover:cursor-pointer hover:bg-indigo-300"
                onClick={() => setActiveMenuItem(item.id)}
              >
                <item.icon className="size-6" />
                {item.id === "online" && (
                  <span className="text-xs">{numberOfOnlineUsers}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:cursor-pointer hover:bg-indigo-300"
                >
                  <Shapes className="size-6" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Herramientas</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="top" className="min-w-fit flex">
            {tools.map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => setActiveMenuItem(tool.id)}
                className="hover:cursor-pointer hover:bg-indigo-50"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={"flex items-center gap-2 style"}>
                      <tool.icon className="size-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{tool.label}</TooltipContent>
                </Tooltip>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
