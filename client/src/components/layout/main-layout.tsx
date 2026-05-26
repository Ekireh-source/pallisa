"use client";

import { ReactNode } from "react";
import { StatCard } from "./stats-card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    title: string | ReactNode;
    description?: string;
    extraHeroContent?: ReactNode;
    backButton?: ReactNode;
    headerActions?: ReactNode;
    IconHidden?: boolean;
    stats?: {
        icon: string;
        label: string;
        value: string;
        change?: string;
        isPositive?: boolean;
    }[];
    actionCols?: 1 | 2 | 3;
    children: ReactNode;
}

export function MainLayout({
    title,
    description,
    extraHeroContent,
    backButton,
    headerActions,
    IconHidden,
    stats,
    actionCols = 1,
    children
}: MainLayoutProps) {
    const pathname = usePathname();

    const getBgClass = () => {
        switch (pathname) {
            case "/dashboard":
                return "bg-Page-Bg";
            default:
                return "bg-white";
        }
    };
    return (
        <div className={`flex flex-col min-h-screen ${getBgClass()}`}>  {/* Blue Header Section */}
            <div className="w-full bg-primary py-6 sm:py-8 print:hidden">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 flex flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        {backButton && (
                            <div className="mt-1 shrink-0">
                                {backButton}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0 w-full">
                            <h1 className="text-[20px] sm:text-[28px] font-bold text-white tracking-tight truncate">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-xs sm:text-[14px] text-blue-100/80 font-medium mb-4 sm:mb-8 mt-1">
                                    {description}
                                </p>
                            )}

                            {extraHeroContent && (
                                <div className="mt-4">
                                    {extraHeroContent}
                                </div>
                            )}
                        </div>
                    </div>
                    {headerActions && (
                        <div className="flex justify-end shrink-0">
                            {headerActions}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container with Negative Margin overlap */}
            <div className={`max-w-7xl mx-auto w-full px-4 md:px-8 ${stats ? "-mt-12 " : ""}print:max-w-none print:px-0 print:mx-0 print:mt-0`}>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    {stats?.map((stat, index) => (
                        <StatCard
                            key={index}
                            IconHidden={IconHidden}
                            icon={stat.icon}
                            label={stat.label}
                            value={stat.value}
                            change={stat.change}
                            isPositive={stat.isPositive}
                        />
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="min-h-[600px] flex flex-col pt-4 w-full min-w-0 print:min-h-0 print:pt-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
