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
            <div className="w-full bg-primary py-6 sm:py-8">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between lg:grid lg:grid-cols-4 gap-4">
                    <div className={cn("flex items-start gap-4 w-full", actionCols === 1 ? "lg:col-span-3" : actionCols === 2 ? "lg:col-span-2" : "lg:col-span-1")}>
                        {backButton && (
                            <div className="mt-1 shrink-0">
                                {backButton}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-3">
                                {typeof title === 'string' ? (
                                    <h1 className="text-[20px] sm:text-[28px] font-bold text-white tracking-tight truncate">{title}</h1>
                                ) : (
                                    title
                                )}
                            </div>
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
                        <div className={cn("flex justify-end items-center w-full sm:w-auto", actionCols === 1 ? "lg:col-span-1" : actionCols === 2 ? "lg:col-span-2" : "lg:col-span-3")}>
                            {/* Desktop View */}
                            <div className="hidden sm:block w-full">
                                {headerActions}
                            </div>

                            {/* Mobile View */}
                            <div className="sm:hidden w-full">
                                {headerActions}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container with Negative Margin overlap */}
            <div className={`max-w-7xl mx-auto w-full px-4 md:px-8 ${stats ? "-mt-12 " : ""}`}>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="min-h-[600px] flex flex-col pt-4 w-full min-w-0">
                    <div className="py-2 w-full min-w-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
