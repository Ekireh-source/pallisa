"use client";

import { useState, useEffect, useRef } from "react";
import { useAppRouter as useRouter } from "@/hooks/useAppRouter";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logoutStart } from "@/store/auth/actions";
import { Icon } from "@iconify/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppLink as Link } from "@/components/navigation/app-link";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FloatingNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();


  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isAdminHovered, setIsAdminHovered] = useState(false);
  const [isSettingsDropDownOpen, setIsSettingsDropDownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoutClick = () => setShowLogoutDialog(true);
  const handleCancelLogout = () => setShowLogoutDialog(false);
  const handleLogout = () => {
    dispatch(logoutStart());
    router.push("/login");
  };


  const NAV_LINKS = [
    { label: "Dashboard", icon: "hugeicons:dashboard-browsing", href: "/dashboard" },
    { label: "Transactions", icon: "hugeicons:bitcoin-transaction", href: "/transactions" },
    { label: "Wallets", icon: "hugeicons:wallet-01", href: "/wallets" },
    { label: "Beneficiaries", icon: "hugeicons:user-multiple", href: "/beneficiaries" },
  ];

  const MORE_LINKS = [
    { label: "Wallet Statements", icon: "hugeicons:wallet-01", href: "/wallet-statements" },
    { label: "Proof of Payment", icon: "hugeicons:payment-01", href: "/proof-of-payment" },
    { label: "Schedule Payment", icon: "hugeicons:transaction", href: "/schedule-payment" },
    { label: "Pay with QR Code", icon: "hugeicons:qr-code", href: "/qr-pay" },
    { label: "Payment Links", icon: "hugeicons:link-01", href: "/payment-links" },
    { label: "Standing Order", icon: "hugeicons:money-send-square", href: "/standing-orders" },
    { label: "Subscriptions", icon: "hugeicons:favourite", href: "/subscriptions" },
    { label: "Overdraft", icon: "hugeicons:license-draft", href: "/overdraft" },
    { label: "Disputes", icon: "hugeicons:cash-01", href: "/disputes" },
    { label: "Reports", icon: "hugeicons:document-validation", href: "/reports" },
    { label: "Help Center", icon: "hugeicons:help-circle", href: "/help" },
  ];

  const handleMouseEnter = () => setIsAdminHovered(true);
  const handleMouseLeave = () => setIsAdminHovered(false);


  return (
    <nav
      className={cn(
        "w-full px-4 sm:px-8 pt-4 pb-2 sticky top-0 z-[50] transition-all duration-300",
        scrolled ? "bg-gradient-to-b from-white via-white/60 to-transparent" : "bg-primary"
      )}
    >
      {/* Desktop Navbar */}
      <div
        className={cn(
          "flex items-center justify-between rounded-[14px] px-6 h-[68px] transition-all duration-300",
          "bg-white border-[2px] border-[#E2E8F0]",
          (pathname === "/dashboard" && !scrolled) ? "" : ""
        )}
      >
        {/* Left Side: Logo + Nav Links */}
        <div className="flex items-center gap-4 xl:gap-6 2xl:gap-8 h-full">
          {/* Logo Section */}
          <div
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer flex items-center gap-3 shrink-0"
          >
            <div className="relative size-[32px] flex items-center justify-center">
              <Image src="/images/baisoft-logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-[#1E293B] tracking-tight text-[18px]">BAISOFT PAY</span>
          </div>

          {/* Vertical Separator */}
          <div className="hidden xl:block h-8 w-[1px] border-[1px] bg-gray-200" />

          {/* Nav Links */}
          <ul className="hidden xl:flex items-center gap-4 xl:gap-6 2xl:gap-8 list-none m-0 p-0 h-full">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
              return (
                <li key={link.href} className="h-full relative flex items-center">
                  <Icon
                    icon={link.icon}
                    className={cn(
                      "size-[24px] transition-colors duration-200",
                      isActive ? "text-primary" : "text-Subtle-Text"
                    )}
                  />
                  <span
                    onClick={() => router.push(link.href)}
                    className={cn(
                      "cursor-pointer text-[16px] font-medium transition-all duration-200 px-1",
                      isActive ? "text-primary" : "text-Subtle-Text hover:text-primary"
                    )}
                  >
                    {link.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-3 left-0 w-full h-[4px] bg-primary rounded-full" />
                  )}
                </li>
              );
            })}

            {/* More Dropdown */}
            <DropdownMenu open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <DropdownMenuTrigger asChild>
                <li
                  onMouseEnter={() => setIsMoreOpen(true)}
                  onMouseLeave={() => setIsMoreOpen(false)}
                  className="h-full relative flex items-center gap-1 cursor-pointer group"
                >
                  <Icon
                    icon="hugeicons:more"
                    className={cn(
                      "size-[24px] transition-colors duration-200",
                      isMoreOpen ? "text-primary" : "text-Subtle-Text group-hover:text-primary"
                    )}
                  />
                  <span className={cn(
                    "text-[16px] font-medium transition-all duration-200 px-1",
                    isMoreOpen ? "text-primary" : "text-Subtle-Text hover:text-primary"
                  )}>
                    More
                  </span>
                  <div className="flex size-[24px] items-center justify-center transition-colors">
                    <Icon icon="hugeicons:arrow-down-01" className={cn(
                      "size-[18px]",
                      isMoreOpen ? "text-primary" : "text-Subtle-Text group-hover:text-primary"
                    )} />
                  </div>
                </li>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 p-2 bg-white rounded-[12px] border border-gray-100 z-[60]"
                onMouseEnter={() => setIsMoreOpen(true)}
                onMouseLeave={() => setIsMoreOpen(false)}
              >
                <div className="grid grid-cols-1 gap-1">
                  {MORE_LINKS.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary/10 group transition-colors"
                    >
                      <div className="flex size-[24px] items-center justify-center transition-colors">
                        <Icon icon={item.icon} className="size-[18px] text-My-Black" />
                      </div>
                      <span className="text-[16px] text-My-Black group-hover:text-primary">
                        {item.label}
                      </span>

                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </ul>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-2">
          {/* Admin Shield Link synchronized with layout.tsx */}
          <div className="hidden sm:flex items-center gap-4">

            <Link
              href={"/merchant-settings"}
              className="text-[#94A3B8] hover:text-[#1E293B] rounded-xl transition-all p-1 relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Icon icon="hugeicons:settings-02" className="size-6" />
              <span
                className={cn(
                  "text-white px-2 py-1 rounded-sm z-10 bg-gray-600 text-[10px] font-medium absolute top-full left-1/2 transform -translate-x-1/2 mt-2 pointer-events-none whitespace-nowrap transition-all duration-200 ease-in-out",
                  isAdminHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}
              >
                Admin Panel
              </span>
            </Link>

            <button className="text-[#94A3B8] hover:text-[#1E293B] transition-colors relative p-1">
              <Icon icon="hugeicons:notification-01" className="size-6" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-slate-100 hidden sm:block mx-1" />


          {/* Profile Section synchronized with layout.tsx */}
          <DropdownMenu
            open={isSettingsDropDownOpen}
            onOpenChange={setIsSettingsDropDownOpen}
          >
            <DropdownMenuTrigger asChild>
              <div suppressHydrationWarning className="flex items-center gap-2 rounded-full px-2 py-1.5 cursor-pointer hover:bg-slate-50 transition-all duration-200">
                <div className="size-9 bg-transparent rounded-full overflow-hidden flex items-center justify-center relative border border-slate-100">
                  <Avatar className="size-full">
                    <AvatarImage src="/images/profile-placeholder.jpg" />
                    <AvatarFallback className="text-myBlack text-[16px]">

                    </AvatarFallback>
                  </Avatar>
                </div>
                {!isMobile && (
                  <div className="flex items-center gap-1.5">

                    {isSettingsDropDownOpen ? (
                      <Icon icon="hugeicons:arrow-up-01" className="size-[20px] text-[#94A3B8] " />
                    ) : (
                      <Icon icon="hugeicons:arrow-down-01" className="size-[20px] text-[#94A3B8] " />
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px] mt-2 rounded-[12px] p-1 -xl border-slate-100">
              <DropdownMenuItem className="!items-start rounded-lg hover:bg-slate-50 cursor-pointer transition-all my-1 px-3 py-2.5">
                <div className="flex items-center justify-start gap-2.5">
                  <Avatar className="size-7">
                    <AvatarImage src="/images/profile-placeholder.jpg" />
                    <AvatarFallback className="bg-[#f0f9ff] text-[#0369A1] text-[10px] font-bold">

                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] font-medium text-myBlack truncate leading-tight">

                    </span>
                    <span className="text-[13px] font-medium text-myBlack truncate">

                    </span>
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-1 border-slate-50" />

              <DropdownMenuItem
                onClick={() => router.push("/users-settings")}
                className="rounded-lg h-10 gap-3 font-medium text-slate-600 hover:text-[#1E293B] cursor-pointer px-3"
              >
                <Icon icon="hugeicons:settings-02" className="size-5" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-1 border-slate-50" />

              <DropdownMenuItem
                onClick={handleLogoutClick}
                className="rounded-lg h-10 gap-3 font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer px-3"
              >
                <Icon icon="hugeicons:logout-02" className="size-5" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Mobile menu burger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="xl:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[#1E293B]"
          >
            <Icon icon={menuOpen ? "hugeicons:cancel-01" : "hugeicons:menu-01"} className="size-6" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={cn(
          "absolute left-4 right-4 mt-3 origin-top xl:hidden z-[60]",
          "rounded-[16px] border border-slate-100 bg-white  overflow-hidden",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          menuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none",
        )}
      >
        <div className="p-3 space-y-1">
          <div className="px-1 pb-3 sm:hidden">

          </div>
          {NAV_LINKS.map((link) => (
            <div
              key={link.href}
              onClick={() => {
                setMenuOpen(false);
                router.push(link.href);
              }}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors",
                pathname === link.href ? "bg-[#f0f9ff] text-primary" : "text-My-Black"
              )}
            >
              {link.label}
            </div>
          ))}
          <div className="h-[1px] bg-slate-50 my-2 mx-2" />
          <div className="pt-1">
            <p className="px-4 text-[16px] font-bold text-My-Black uppercase tracking-widest mb-2">More</p>
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {MORE_LINKS.map((link) => (
                <div
                  key={link.href}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(link.href);
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl px-4 py-3 flex items-center gap-3 transition-colors",
                    pathname === link.href ? "bg-[#f0f9ff] text-primary" : "text-My-Black hover:bg-gray-50"
                  )}
                >
                  <span className="text-[15px] font-semibold">{link.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sm:hidden px-4">
            <Link
              href={"/merchant-settings"}
              className="text-My-Black rounded-xl transition-all relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span className="text-[15px] font-semibold transition-colors">Settings</span>

            </Link>
          </div>


          <div className="h-[1px] bg-slate-50 my-2 mx-2" />

          <div
            onClick={() => {
              setMenuOpen(false);
              handleLogoutClick();
            }}
            className="cursor-pointer rounded-xl px-4 py-3 text-[15px] font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
          >
            <Icon icon="hugeicons:logout-02" className="size-5" />
            Logout
          </div>
        </div>
      </div>

      {/* Logout Dialog synchronized with layout.tsx */}
      <Dialog
        open={showLogoutDialog}
        onOpenChange={(open: any) => {
          if (!open) {
            handleCancelLogout();
          } else {
            setShowLogoutDialog(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="py-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-2 size-16 flex items-center justify-center shrink-0">
                <Icon
                  icon="hugeicons:logout-02"
                  className="!size-8 text-primary"
                />
              </div>
              <div className="text-left space-y-1">
                <DialogTitle className="text-xl font-semibold">
                  Are you sure you want to log out?
                </DialogTitle>
                <DialogDescription className="text-base font-normal text-muted-foreground">
                  You will need to log in again to access your account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              className="w-full rounded-full"
              variant="outline"
              onClick={handleCancelLogout}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full rounded-full"
              variant="destructive"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}