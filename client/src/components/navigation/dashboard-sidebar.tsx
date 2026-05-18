"use client";

import type React from "react";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppRouter as useRouter } from "@/hooks/useAppRouter";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { NavItemComponent } from "./nav-item";

import { useIsMobile } from "@/hooks/use-mobile";
import { NavItem } from "@/types/dashboard/dash.types";

interface DashboardSideBarProps {
    isSideBarOpen: boolean;
    setIsSideBarOpen: (value: boolean) => void;
}

export default function DashboardSideBar({ isSideBarOpen, setIsSideBarOpen }: DashboardSideBarProps) {
    const selectedInstitution = "";
    const isMobile = useIsMobile();
    const router = useRouter();
    const school = useSelector((state: any) => state.auth.school);
    
    const [filteredNavItems, setFilteredNavItems] = useState<NavItem[]>([]);
    const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
    const [expandedSubItems, setExpandedSubItems] = useState<{ [key: string]: boolean }>({});
    const [InstitutionLogo, setInstitutionLogo] = useState<string | null>(null);
    const [InstitutionName, setInstitutionName] = useState("Pallisa High School");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrollPercentage, setScrollPercentage] = useState(0);

    useEffect(() => {
        if (school?.name) {
            setInstitutionName(school.name);
        }
        if (school?.logo) {
            setInstitutionLogo(school.logo);
        }
    }, [school]);

    useEffect(() => {
        const scrollElement = document.getElementById("mobile-nav-scroll");

        const handleScroll = () => {
            if (scrollElement) {
                const { scrollTop, scrollHeight, clientHeight } = scrollElement;

                const scrollableHeight = scrollHeight - clientHeight;

                if (scrollableHeight > 0) {
                    const scrollPercent = (scrollTop / scrollableHeight) * 100;
                    setScrollPercentage(Math.min(Math.max(scrollPercent, 0), 100));
                }
            }
        };

        if (scrollElement) {
            scrollElement.addEventListener("scroll", handleScroll);
            setTimeout(handleScroll, 100);
            return () => scrollElement.removeEventListener("scroll", handleScroll);
        }
    }, [mobileMenuOpen, filteredNavItems]);

    useEffect(() => {
        setMobileMenuOpen(isSideBarOpen);
    }, [isSideBarOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuOpen && isMobile) {
                const target = event.target as HTMLElement;

                if (
                    !target.closest(".mobile-nav-drawer") &&
                    !target.closest(".mobile-menu-button")
                ) {
                    onCloseSidebar();
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [mobileMenuOpen, isMobile]);

    const toggleExpand = (title: string) => {
        setExpandedItems((prev) => ({ [title]: !prev[title] }));
    };

    const toggleSubExpand = (title: string) => {
        setExpandedSubItems((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    const onCloseSidebar = () => {
        setIsSideBarOpen(false);
    };

    const navItems: NavItem[] = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: (
                <Icon
                    icon="hugeicons:dashboard-browsing"
                    className="!w-6 !h-6"
                    width="28"
                    height="28"
                />
            ),
        },
        {
            title: "Academic",
            href: "#academic",
            icon: (
                <Icon
                    icon="hugeicons:graduation-cap"
                    className="!w-6 !h-6"
                    width="28"
                    height="28"
                />
            ),
            submenu: [
                { title: "Academic Years", href: "/academic-years" },
                { title: "Terms", href: "/terms" },
                { title: "Classes", href: "/classes" },
                { title: "Streams", href: "/streams" },
                { title: "Subjects", href: "/subjects" },
                { title: "Topics", href: "/topics" },
                { title: "Reports", href: "/reports" },
                { title: "Grading System", href: "/grading" },
            ],
        },
        {
            title: "Assessments",
            href: "#assessments",
            icon: (
                <Icon
                    icon="hugeicons:task-01"
                    className="!w-6 !h-6"
                    width="28"
                    height="28"
                />
            ),
            submenu: [
                { title: "Exams", href: "/exams" },
                { title: "Competency Areas", href: "/competences" },
                { title: "Activity of Integration", href: "/activity-of-integration" },
                { title: "Topics", href: "/topics" },
            ],
        },
        {
            title: "Members",
            href: "#members",
            icon: (
                <Icon
                    icon="hugeicons:user-multiple"
                    className="!w-6 !h-6"
                    width="28"
                    height="28"
                />
            ),
            submenu: [
                { title: "Students", href: "/students" },
                { title: "Teachers", href: "/teachers" },
                { title: "Non-Staff Members", href: "/non-staff-members" },
                { title: "Parents", href: "/parents" },
            ],
        },
        {
            title: "Management",
            href: "#management",
            icon: (
                <Icon
                    icon="hugeicons:building-03"
                    className="!w-6 !h-6"
                    width="28"
                    height="28"
                />
            ),
            submenu: [
                { title: "School Info", href: "/school" },
                { title: "Campuses", href: "/campuses" },
                { title: "Roles & Permissions", href: "/roles" },
                { title: "Departments", href: "/departments" },
                { title: "Vendors", href: "/vendors" },
            ],
        },
        {
            title: "Finance",
            href: "#finance",
            icon: (
                <Icon
                    icon="hugeicons:wallet-01"
                    className="!w-6 !h-6"
                    width="28"
                    height="28"
                />
            ),
            submenu: [
                { title: "Expenses", href: "/expenses" },
                { title: "Categories", href: "/categories" },
            ],
        },
    ];

    useEffect(() => {
        setFilteredNavItems(navItems);
    }, [school]);

    const onToggle = () => {
        if (isMobile) {
            setIsSideBarOpen(!isSideBarOpen);
        } else {
            if (isSideBarOpen) {
                setIsSideBarOpen(false);
            } else {
                setIsSideBarOpen(true);
            }
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            {!isMobile && (
                <div
                    className={`${isSideBarOpen ? "w-64" : "w-20"
                        } bg-white border-r-[2px] border-gray-100 fixed h-full transition-all duration-300 z-30`}
                >
                    <div className="p-4 border-b border-gray-100 h-16 max-h-16 flex items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 aspect-square text-white rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden relative shadow-md shadow-indigo-100/50">
                                {InstitutionLogo ? (
                                    <Image
                                        alt={InstitutionName}
                                        className="object-cover object-center w-full h-full"
                                        fill
                                        src={InstitutionLogo}
                                    />
                                ) : (
                                    <Icon
                                        icon="hugeicons:school"
                                        className="w-5 h-5 text-white"
                                    />
                                )}
                            </div>
                            {isSideBarOpen && (
                                <span className="font-bold text-[var(--sidebar-foreground)] line-clamp-1">
                                    {InstitutionName}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-2 overflow-y-auto h-[90svh] pt-4 space-y-[3px] pb-16">
                        {filteredNavItems.map((item, index) => (
                            <NavItemComponent
                                key={index}
                                item={item}
                                isMobileView={false}
                                index={index}
                                expandedItems={expandedItems}
                                expandedSubItems={expandedSubItems}
                                onExpand={toggleExpand}
                                onSubExpand={toggleSubExpand}
                                onToggle={onToggle}
                                isSideBarOpen={isSideBarOpen}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Mobile Navigation Drawer */}
            {isMobile && (
                <>
                    {/* Overlay */}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" />
                    )}

                    {/* Drawer */}
                    <div
                        className={`mobile-nav-drawer fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out z-[100] flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-gray-100 min-h-16 h-20 max-h-20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 aspect-square text-white rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden relative shadow-md shadow-indigo-100/50">
                                    {InstitutionLogo ? (
                                        <Image
                                            alt="Institution Logo"
                                            className="object-cover object-center w-full h-full"
                                            fill
                                            src={InstitutionLogo}
                                        />
                                    ) : (
                                        <Icon icon="hugeicons:school" className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <span className="font-bold text-gray-900">{InstitutionName}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggle}
                                className="p-2 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-4 border-b border-gray-100 space-y-3">
                            {/* <InstitutionBranchSelector /> */}
                        </div>
                        {/* Navigation Items */}
                        <div
                            className="flex-1 overflow-y-auto p-2 pb-20 min-h-[600px]"
                            id="mobile-nav-scroll"
                        >
                            {filteredNavItems.map((item, idx) => (
                                <NavItemComponent
                                    key={idx}
                                    item={item}
                                    isMobileView={true}
                                    index={idx}
                                    expandedItems={expandedItems}
                                    expandedSubItems={expandedSubItems}
                                    onExpand={toggleExpand}
                                    onSubExpand={toggleSubExpand}
                                    onToggle={onToggle}
                                    isSideBarOpen={true}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
