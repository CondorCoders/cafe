"use client";
import { ChevronUp, MessageCircle, Music, UsersRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "./ui/sidebar";
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

const menuItems = [
  { id: "online", label: "Online", icon: UsersRound },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "music", label: "Música", icon: Music },
];

export interface User {
  id: string;
  full_name: string;
  username: string;
  profile_url: string;
}

interface AppSidebarProps {
  user: User;
}

export const AppSidebar = ({ user }: AppSidebarProps) => {
  const [activeMenuItem, setActiveMenuItem] = useState<string | undefined>();

  return (
    <Sidebar variant="floating" className="md:absolute" collapsible="icon">
      <SidebarTrigger className="group-data-[collapsible=icon]:mx-auto mt-2" />
      <SidebarContent>
        {!activeMenuItem && (
          <SidebarGroup>
            <ul className="no-list-style w-full flex flex-col gap-2">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  className="w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:cursor-pointer"
                    onClick={() => setActiveMenuItem(item.id)}
                  >
                    <item.icon className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </SidebarGroup>
        )}
        {activeMenuItem === "online" && <OnlineUsers />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="group-data-[collapsible=icon]:p-0">
                  <Avatar className="size-6">
                    <AvatarImage src={user.profile_url} />
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>{" "}
                  {user.full_name}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-full">
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
