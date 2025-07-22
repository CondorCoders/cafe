import { ChevronUp, MessageCircle, Music, UsersRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
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

const menuItems = [
  { label: "Online", icon: UsersRound },
  { label: "Chat", icon: MessageCircle },
  { label: "Música", icon: Music },
];

interface AppSidebarProps {
  user: {
    id: string;
    full_name: string;
    profile_url: string;
  };
}

export const AppSidebar = ({ user }: AppSidebarProps) => {
  return (
    <Sidebar variant="floating" className="md:absolute" collapsible="icon">
      <SidebarTrigger className="group-data-[collapsible=icon]:mx-auto mt-2" />
      <SidebarHeader>
        <h1 className="text-lg font-bold group-data-[collapsible=icon]:hidden">
          Menú
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <ul className="no-list-style w-full flex flex-col gap-4">
            {menuItems.map((item) => (
              <li
                key={item.label}
                className="w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
              >
                <item.icon className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </SidebarGroup>
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
