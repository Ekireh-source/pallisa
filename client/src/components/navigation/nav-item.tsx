import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";


import { Button } from "@/components/ui/button";
import { NavItem } from "@/types/dashboard/dash.types";
import { useIsMobile } from "@/hooks/use-mobile";

export const NavItemComponent = ({
    item,
    isMobileView = false,
    index,
    expandedItems,
    expandedSubItems,
    onExpand,
    onToggle,
    onSubExpand,
    isInvitedEmployee = false,
    isSideBarOpen = true,
}: {
    item: NavItem;
    expandedItems: { [key: string]: boolean };
    expandedSubItems?: { [key: string]: boolean };
    isMobileView: boolean;
    index: number;
    onExpand: (title: string) => void;
    onToggle: () => void;
    onSubExpand?: (title: string) => void;
    isInvitedEmployee?: boolean;
    isSideBarOpen?: boolean;
}) => {
    const pathname = usePathname();
    const isActive = item.submenu
        ? item.submenu.some(
            (sub) =>
                pathname === sub.href ||
                (sub.submenu && sub.submenu.some((subSub) => pathname === subSub.href)),
        )
        : pathname === item.href;

    const isExpanded = expandedItems[item.title];
    const hoveredTooltipRef = useRef<HTMLSpanElement | null>(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    // const isSideBarOpen = useSelector(selectSideBarOpened);
    const isMobile = useIsMobile();
    const router = useRouter();

    return (
        <div key={`${item.title}-${index}`} className="w-full py-1 relative">
            <Button
                disabled={!item.href || (item.href.startsWith("#") && !item.submenu?.length)}
                variant="ghost"
                className={`w-full !rounded-xl flex items-center px-2 !py-4 text-sm text-gray-600 hover:bg-primary/10 hover:text-primary ${isActive ? "bg-primary/10 text-primary" : "hover:bg-opacity-30"
                    } ${isSideBarOpen ? "justify-between " : "justify-center "}`}
                onMouseEnter={() => {
                    if (!isSideBarOpen && !isMobile) setIsTooltipVisible(true);
                }}
                onMouseLeave={() => setIsTooltipVisible(false)}
                onClick={() => {
                    if (!isSideBarOpen) onToggle();
                    if (item.submenu) {
                        onExpand(item.title);
                    } else {
                        router.push(item.href);
                    }
                }}
            >
                <div className="flex items-center space-x-2 relative line-clamp-1 max-w-full">
                    {item.icon}
                    {isSideBarOpen ? <span className="truncate">{item.title}</span> : null}
                </div>
                {isSideBarOpen && item.submenu ? (
                    isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )
                ) : null}
            </Button>

            {/* Render Tooltip when collapsed */}
            {isTooltipVisible && !isSideBarOpen && !isMobileView && (
                <div className="absolute left-[4.5rem] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white font-medium text-xs rounded-md shadow-xl z-[100] pointer-events-none whitespace-nowrap flex items-center animate-in fade-in zoom-in-95 duration-100">
                    {item.title}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900" />
                </div>
            )}

            {/* Render Submenu (Level 2) */}
            {isSideBarOpen && item.submenu && isExpanded && (
                <div className="pl-6 mt-1 space-y-1 border-l border-gray-100 ml-5 animate-in slide-in-from-top-1 duration-200">
                    {item.submenu.map((sub, idx) => {
                        const isSubActive = pathname === sub.href;
                        return (
                            <Button
                                key={`${sub.title}-${idx}`}
                                variant="ghost"
                                className={`w-full rounded-lg flex items-center justify-start px-3 py-2 text-xs text-gray-500 hover:bg-primary/5 hover:text-primary transition-all duration-200 ${
                                    isSubActive ? "bg-primary/5 text-primary font-bold" : ""
                                }`}
                                onClick={() => {
                                    if (isMobile) onToggle();
                                    router.push(sub.href);
                                }}
                            >
                                <span className="truncate">{sub.title}</span>
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
