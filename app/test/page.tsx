import { Navbar, NavbarStart, NavbarEnd } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";

export default function TestPage() {
  return (
    <div className="w-screen h-screen overflow-x-hidden">
      <Navbar className="border-b border-base-300 sticky top-0 z-50 bg-base-100">
        <NavbarStart>
          <a className="btn btn-ghost text-xl font-bold tracking-tight">MARKER</a>
        </NavbarStart>
        <NavbarEnd className="flex items-center gap-2 pr-2">
          <a className="btn btn-ghost">Dashboard</a>
          <Dropdown position="end">
            <DropdownTrigger>
              <div className="btn btn-ghost btn-circle avatar">
                <Avatar email="test@test.com" fallback="T" />
              </div>
            </DropdownTrigger>
            <DropdownContent className="w-52 mt-4">
              <DropdownItem><a>Profile</a></DropdownItem>
              <DropdownItem><a>Logout</a></DropdownItem>
            </DropdownContent>
          </Dropdown>
        </NavbarEnd>
      </Navbar>
    </div>
  );
}
