"use client";

import { Icon } from "@iconify/react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    className?: string;
    IconHidden?: boolean;
}

export function StatCard({ icon, label, value, change, isPositive, className, IconHidden }: StatCardProps) {
    const formatValue = (val: string | number) => {
        const str = String(val);
        const num = Number(str.replace(/[^0-9.-]+/g, ""));
        if (isNaN(num) || str.replace(/[^0-9.-]+/g, "") === "") return str;

        const compactNum = Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
        
        // Try to preserve currency symbols if they exist (e.g., "UGX 450,000" -> "UGX 450K")
        const match = str.match(/^([^0-9.-]*)([0-9.,]+)([^0-9.-]*)$/);
        if (match) {
            return `${match[1]}${compactNum}${match[3]}`;
        }
        return compactNum;
    };

    const compactValue = formatValue(value);

    return (
        <Card className={`p-[16px] border-[1px] border-[#E8E8F2] flex flex-row items-center gap-4 bg-white rounded-[12px] ${className}`}>
            {!IconHidden && (
                <div className="w-12 h-12 bg-[#F0F9FF] rounded-xl flex items-center justify-center border border-[#E0F2FE]">
                    <Icon icon={icon} className="h-6 w-6 text-[#0369A1]" />
                </div>
            )}
            <div className="flex flex-col gap-1">
                <p className="text-[14px] font-medium text-[#64748B]">{label}</p>
                <div className="flex items-center gap-2">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-[20px] font-bold text-[#1E293B] cursor-default">{compactValue}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{String(value)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {change && (
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'} transition-colors`}>
                            <Icon
                                icon={isPositive ? "hugeicons:arrow-up-01" : "hugeicons:arrow-down-01"}
                                className={`h-3 w-3`}
                            />
                            <span className="text-[10px] font-bold">
                                {change}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
