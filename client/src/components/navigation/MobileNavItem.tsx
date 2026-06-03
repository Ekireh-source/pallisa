"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface SubMenuItem {
  title: string;
  href: string;
  icon?: string;
  group?: string; // Optional group header
  onClick?: () => void;
}

export interface MobileNavItemProps {
  title: string;
  icon: string | React.ReactNode;
  href?: string;
  subItems?: SubMenuItem[];
  isActive?: boolean;
  onClick?: () => void;
}

export function MobileNavItem({ title, icon, href, subItems, isActive, onClick }: MobileNavItemProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const TriggerButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, any>((props, ref) => {
    const className = `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] min-h-[44px] gap-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
      }`;

    if (href && (!subItems || subItems.length === 0)) {
      return (
        <Link href={href} ref={ref as any} className={className} onClick={onClick} {...props}>
          {typeof icon === "string" ? <Icon icon={icon} className="w-[22px] h-[22px]" /> : icon}
          <span className="text-[10px] font-medium leading-none">{title}</span>
        </Link>
      );
    }

    return (
      <button ref={ref as any} className={className} onClick={onClick} {...props}>
        {typeof icon === "string" ? <Icon icon={icon} className="w-[22px] h-[22px]" /> : icon}
        <span className="text-[10px] font-medium leading-none">{title}</span>
      </button>
    );
  });
  TriggerButton.displayName = "TriggerButton";

  if (!subItems || subItems.length === 0) {
    return <TriggerButton />;
  }

  // Group items if they have group properties
  const renderSubItems = () => {
    let currentGroup: string | undefined = undefined;

    return subItems.map((item, index) => {
      const isSubActive = pathname === item.href || pathname.startsWith(item.href + "/");
      const showGroupHeader = item.group && item.group !== currentGroup;

      if (showGroupHeader) {
        currentGroup = item.group;
      }

      return (
        <React.Fragment key={item.title}>
          {showGroupHeader && (
            <div className="text-xs font-bold text-My-Black uppercase tracking-wider mt-4 mb-2 px-3">
              {item.group}
            </div>
          )}
          {item.onClick ? (
            <button
              type="button"
              onClick={() => {
                if (item.onClick) item.onClick();
                setTimeout(() => setOpen(false), 10);
              }}
              className={cn(
                "flex w-full items-center gap-3 p-3 rounded-xl transition-colors font-medium text-sm",
                item.title === "Logout" ? "text-red-600 hover:bg-red-50" : "text-My-Black hover:bg-gray-50"
              )}
            >
              {item.icon && <Icon icon={item.icon} className={cn("w-5 h-5", item.title === "Logout" ? "text-red-500" : "text-My-Black")} />}
              {item.title}
            </button>
          ) : (
            <Link
              href={item.href}
              onClick={() => {
                // Delay closing to allow nextjs-toploader to intercept the click event
                // before the element is unmounted from the DOM
                setTimeout(() => setOpen(false), 10);
              }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors font-medium text-sm",
                isSubActive
                  ? "bg-primary/10 text-primary"
                  : "text-My-Black hover:bg-gray-50"
              )}
            >
              {item.icon && <Icon icon={item.icon} className="w-5 h-5 text-My-Black" />}
              {item.title}
            </Link>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <TriggerButton />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[20px] p-0 border-t-0 bg-white md:max-w-[400px] mx-auto md:mb-[100px] md:rounded-[20px] md:border md:-2xl">
        <SheetHeader className="p-4 border-b border-gray-100 text-left">
          <SheetTitle className="text-lg font-bold text-My-Black flex items-center gap-2">
            {typeof icon === "string" ? <Icon icon={icon} className="w-5 h-5 text-primary" /> : <span className="text-primary flex items-center justify-center w-5 h-5">{icon}</span>}
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 max-h-[65vh] overflow-y-auto grid grid-cols-1 gap-1 pb-8">
          {renderSubItems()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
