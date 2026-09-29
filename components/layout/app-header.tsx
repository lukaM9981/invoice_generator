"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiMenuLine, RiUserLine } from "@remixicon/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/lib/auth/actions";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
] as const;

export function AppHeader({ email }: { email: string | null }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const initial = email?.trim().charAt(0).toUpperCase() ?? "";

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet
            open={mobileNavigationOpen}
            onOpenChange={setMobileNavigationOpen}
          >
            <SheetTrigger
              aria-label="Open navigation"
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "md:hidden",
              })}
            >
              <RiMenuLine />
            </SheetTrigger>

            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>

              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1 px-2"
              >
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={buttonVariants({
                      variant:
                        pathname === item.href ? "secondary" : "ghost",
                      className: "w-full justify-start",
                    })}
                    onClick={() => setMobileNavigationOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/dashboard"
            className="flex h-7 shrink-0 items-center font-heading text-base font-semibold"
          >
            Invoice Generator
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 md:ml-8 md:flex lg:ml-12"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={buttonVariants({
                  variant: pathname === item.href ? "secondary" : "ghost",
                  size: "sm",
                })}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            aria-label="Open profile menu"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "rounded-full",
            })}
          >
            <Avatar>
              <AvatarFallback>
                {initial || <RiUserLine aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {email ?? "Signed-in account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings" />}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem
                nativeButton
                render={<button type="submit" className="w-full" />}
              >
                Log out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
