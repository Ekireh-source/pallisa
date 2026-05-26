"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
}

export interface ResponsiveHeaderActionsProps {
  primary?: ActionItem;
  secondary?: ActionItem[];
}

export function ResponsiveHeaderActions({ primary, secondary = [] }: ResponsiveHeaderActionsProps) {
  const allActions = [];
  if (primary) allActions.push({ ...primary, _isPrimary: true });
  allActions.push(...secondary);

  if (allActions.length === 0) return null;

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:flex items-center gap-3 justify-end">
        {secondary.map((action, idx) => (
          action.href ? (
            <Button
              key={idx}
              variant={action.variant === "danger" ? "destructive" : "outline"}
              className="rounded-xl h-11 border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold"
              asChild
            >
              <Link href={action.href}>
                {action.icon && <span className="mr-2 flex items-center">{action.icon}</span>}
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button
              key={idx}
              variant={action.variant === "danger" ? "destructive" : "outline"}
              className="rounded-xl h-11 border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold"
              onClick={action.onClick}
            >
              {action.icon && <span className="mr-2 flex items-center">{action.icon}</span>}
              {action.label}
            </Button>
          )
        ))}
        
        {primary && (
          primary.href ? (
            <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" asChild>
              <Link href={primary.href}>
                {primary.icon && <span className="mr-2 flex items-center text-primary">{primary.icon}</span>}
                {primary.label}
              </Link>
            </Button>
          ) : (
            <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" onClick={primary.onClick}>
              {primary.icon && <span className="mr-2 flex items-center text-primary">{primary.icon}</span>}
              {primary.label}
            </Button>
          )
        )}
      </div>

      {/* Mobile View */}
      <div className="lg:hidden flex justify-end">
        {allActions.length === 1 ? (
           // Single Action
           allActions[0].href ? (
             <Button className="rounded-xl h-9 w-9 bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm flex items-center justify-center p-0 shrink-0" asChild>
                <Link href={allActions[0].href}>
                  {allActions[0].icon || <MoreVertical className="w-4 h-4" />}
                </Link>
             </Button>
           ) : (
             <Button className="rounded-xl h-9 w-9 bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm flex items-center justify-center p-0 shrink-0" onClick={allActions[0].onClick}>
                {allActions[0].icon || <MoreVertical className="w-4 h-4" />}
             </Button>
           )
        ) : (
          // Multiple Actions
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-xl h-9 w-9 bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm flex items-center justify-center cursor-pointer p-0 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-2xl border-gray-100 bg-white p-2">
              {allActions.map((action, idx) => {
                const isPrimary = (action as any)._isPrimary;
                const textColor = action.variant === "danger" ? "text-rose-600 focus:text-rose-600 hover:text-rose-600" : "text-gray-700";
                
                if (action.href) {
                  return (
                    <DropdownMenuItem key={idx} className={`cursor-pointer rounded-xl py-2.5 font-medium flex items-center gap-2 hover:bg-gray-50 focus:bg-gray-50 ${textColor}`} asChild>
                      <Link href={action.href}>
                        {action.icon && <span className={`${isPrimary ? "text-primary" : (action.variant === "danger" ? "" : "text-gray-500")} flex items-center`}>{action.icon}</span>}
                        {action.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                }
                return (
                  <DropdownMenuItem key={idx} onClick={action.onClick} className={`cursor-pointer rounded-xl py-2.5 font-medium flex items-center gap-2 hover:bg-gray-50 focus:bg-gray-50 ${textColor}`}>
                    {action.icon && <span className={`${isPrimary ? "text-primary" : (action.variant === "danger" ? "" : "text-gray-500")} flex items-center`}>{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  );
}
