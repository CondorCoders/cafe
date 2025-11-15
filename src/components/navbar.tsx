import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { ProfileType } from "./profile-form";

interface NavbarProps {
  user?: ProfileType;
}

export const Navbar = ({ user }: NavbarProps) => {
  return (
    <div className="w-full p-4 fixed top-0 bg-[#EFEFED]/90 shadow z-10">
      <nav className="w-full max-w-7xl mx-auto">
        <ul className="w-full flex items-center justify-between gap-4">
          <li className="flex items-center">
            <Image
              src="/assets/Cafescript.png"
              alt="Logo"
              width={40}
              height={40}
            />
            <span className="font-jersey text-2xl">Cafescript</span>
          </li>
          {user && (
            <li>
              <LogoutButton />
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};
