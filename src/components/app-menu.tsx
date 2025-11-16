"use client";
import {
  ChevronUp,
  Clock,
  MessageCircle,
  Music,
  Shapes,
  Smile,
  UsersRound,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnlineUsers } from "./sidebar-features/online-users";
import { useOnlineUsers } from "@/context/online-users-context";
import { GeneralChat } from "./sidebar-features/general-chat";
import { MusicPlayer } from "./sidebar-features/music-player";
import { Pomodoro } from "./sidebar-features/pomodoro";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogoutButton } from "@/components/logout-button";
import { Emotes } from "./sidebar-features/emotes";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { ProfileForm, ProfileType } from "./profile-form";

const menuItems = [
  { id: "online", label: "Online", icon: UsersRound },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "emotes", label: "Emotes", icon: Smile },
];

const tools = [
  { id: "music", label: "Música", icon: Music },
  { id: "pomodoro", label: "Pomodoro", icon: Clock },
];

interface AppSidebarProps {
  user: ProfileType;
}

const ProfileMenu = ({
  user,
  onClose,
}: {
  user: ProfileType;
  onClose: () => void;
}) => {
  return (
    <div
      className="bg-indigo-950/90 rounded-t-2xl rounded-b-none sm:rounded-2xl mb-1 text-white relative max-h-96 overflow-hidden"
      style={{ width: "var(--menu-width)" }}
    >
      <div className="w-full flex items-center px-3 py-3 justify-between border-b-[1px] border-gray-500">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profile_url} />
            <AvatarFallback>
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-sm font-medium">@{user.username}</h2>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="hover:bg-indigo-300"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="p-4 pt-2">
        <LogoutButton className="w-full" />
      </div>
    </div>
  );
};

export const AppMenu = ({ user }: AppSidebarProps) => {
  const [activeMenuItem, setActiveMenuItem] = useState<
    string | undefined | null
  >();
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { onlineUsers } = useOnlineUsers();
  const numberOfOnlineUsers = Object.keys(onlineUsers).length;

  useEffect(() => {
    const menuNode = menuRef.current;
    if (!menuNode) return;

    const observer = new ResizeObserver(() => {
      setMenuWidth(menuNode.offsetWidth);
    });

    observer.observe(menuNode);

    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Dialog
        open={activeMenuItem === "profile"}
        onOpenChange={() => setActiveMenuItem(null)}
      >
        <DialogContent>
          <DialogTitle>Personaliza tu perfil</DialogTitle>
          <ProfileForm profile={user} />
        </DialogContent>
      </Dialog>

      <div className="absolute z-50 bottom-0 left-0 w-full sm:left-4 sm:w-auto sm:translate-x-0 sm:rounded-2xl sm:m-4 m-0 rounded-none">
        {activeMenuItem && (
          <div
            className="bg-indigo-950/90 rounded-t-2xl rounded-b-none sm:rounded-2xl mb-1 text-white relative max-h-96 overflow-hidden"
            style={{ width: `${menuWidth}px` }}
          >
            <div className="w-full flex items-center px-3 py-1 justify-between border-b-[1px] border-gray-500">
              <h2 className="text-sm">
                {
                  [...menuItems, ...tools].find(
                    (item) => item.id === activeMenuItem
                  )?.label
                }
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
            {activeMenuItem === "emotes" && <Emotes />}
          </div>
        )}
        <div
          ref={menuRef}
          className="flex items-center justify-center p-2 sm:p-3 rounded-none sm:rounded-2xl shadow-lg bg-indigo-950/70 hover:bg-indigo-950/100 transition-colors text-white backdrop-blur-md gap-1 sm:gap-2 w-full"
        >
          {/* Mobile  */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              className="hover:cursor-pointer hover:bg-indigo-300 p-2 sm:p-2 relative"
              onClick={() => {
                setActiveMenuItem(null);
                setShowMobileProfile(!showMobileProfile);
              }}
            >
              <Avatar className="size-8">
                <AvatarImage src={user.profile_url} />
                <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
            {showMobileProfile && (
              <div
                className="absolute bottom-full left-0 mb-1 w-full"
                style={{ width: `${menuWidth}px` }}
              >
                <ProfileMenu
                  user={user}
                  onClose={() => setShowMobileProfile(false)}
                />
              </div>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex hover:bg-indigo-300 rounded-md hover:text-indigo-950 items-center justify-center gap-2 hover:cursor-pointer px-1">
                <Avatar className="size-10">
                  <AvatarImage src={user.profile_url} />
                  <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user.full_name}</span>
                <ChevronUp className="ml-auto hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-full">
                <DropdownMenuItem>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveMenuItem("profile")}
                  >
                    Perfil
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogoutButton className="w-full" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {menuItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:cursor-pointer hover:bg-indigo-300 p-2 sm:p-2"
                  onClick={() => {
                    setActiveMenuItem(item.id);
                    setShowMobileProfile(false);
                  }}
                >
                  <item.icon className="size-5 sm:size-6" />
                  {item.id === "online" && (
                    <span className="text-xs">{numberOfOnlineUsers}</span>
                  )}
                  <span className="sr-only">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{item.label}</TooltipContent>
            </Tooltip>
          ))}

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hover:cursor-pointer hover:bg-indigo-300 p-2 sm:p-2"
                  >
                    <Shapes className="size-5 sm:size-6" />
                    <span className="sr-only">Herramientas</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Herramientas</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              side="top"
              className="min-w-fit flex flex-col sm:flex-row"
            >
              {tools.map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveMenuItem(tool.id);
                        setShowMobileProfile(false);
                      }}
                      className="hover:cursor-pointer hover:bg-indigo-50 p-2"
                    >
                      <tool.icon className="size-5" />
                      <span className="sr-only">{tool.label}</span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="top">{tool.label}</TooltipContent>
                </Tooltip>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};
