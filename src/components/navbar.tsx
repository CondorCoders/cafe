import Image from "next/image";
import { LogoutButton } from "./logout-button";
import Link from "next/link";
import { User } from "./app-menu";

interface NavbarProps {
  user?: User;
}

export const Navbar = ({ user }: NavbarProps) => {
  return (
    <div className="w-full p-4 fixed top-0 bg-white shadow z-10">
      <nav className="w-full max-w-7xl mx-auto">
        <ul className="w-full flex items-center gap-4">
          <li className="flex items-center">
            <Image
              src="/assets/Cafescript.png"
              alt="Logo"
              width={40}
              height={40}
            />
            <span className="font-jersey text-2xl">Cafescript</span>
          </li>
          <li className="ml-auto">
            <Link href="/about" className="hover:underline">
              Sobre el proyecto
            </Link>
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
