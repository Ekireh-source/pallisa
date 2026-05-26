"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MobileNavItem } from "./MobileNavItem";

interface MobileBottomNavProps {
  onMoreClick?: () => void; // Keeping it optional if we don't need it outside anymore
}

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "hugeicons:dashboard-browsing",
    },
    {
      title: "Academic",
      icon: "hugeicons:global-education",
      subItems: [
        { title: "Academic Years", href: "/academic-years", icon: "hugeicons:calendar-03" },
        { title: "Terms", href: "/terms", icon: "hugeicons:book-02" },
        { title: "Classes", href: "/classes", icon: "hugeicons:class" },
        { title: "Streams", href: "/streams", icon: "hugeicons:flow-square" },
        { title: "Subjects", href: "/subjects", icon: "hugeicons:book-open-01" },
        { title: "Topics", href: "/topics", icon: "hugeicons:books-01" },
        { title: "Reports", href: "/reports", icon: "hugeicons:document-attachment" },
        { title: "Grading System", href: "/grading", icon: "hugeicons:star" },
      ],
    },
    {
      title: "Assessments",
      icon: "hugeicons:task-01",
      subItems: [
        { title: "Exams", href: "/exams", icon: "hugeicons:test-tube-01" },
        { title: "SA Marks Grid", href: "/exams/sa-assessment", icon: "hugeicons:grid-view" },
        { title: "Projects Matrix", href: "/competences/projects", icon: "hugeicons:matrix" },
        { title: "Competency Areas", href: "/competences", icon: "hugeicons:target-01" },
        { title: "Activity of Integration", href: "/activity-of-integration", icon: "hugeicons:puzzle" },
        { title: "Topics", href: "/topics", icon: "hugeicons:books-01" },
      ],
    },
    {
      title: "Members",
      icon: "hugeicons:user-multiple",
      subItems: [
        { title: "Students", href: "/students", icon: "hugeicons:student" },
        { title: "Teachers", href: "/teachers", icon: "hugeicons:teacher" },
        { title: "Non-Staff Members", href: "/non-staff-members", icon: "hugeicons:user-group" },
        { title: "Parents", href: "/parents", icon: "hugeicons:users-01" },
      ],
    },
    {
      title: "More",
      icon: "hugeicons:more-horizontal",
      subItems: [
        { group: "Management", title: "School Info", href: "/school", icon: "hugeicons:school" },
        { group: "Management", title: "Campuses", href: "/campuses", icon: "hugeicons:building-03" },
        { group: "Management", title: "Roles & Permissions", href: "/roles", icon: "hugeicons:user-shield-01" },
        { group: "Management", title: "Departments", href: "/departments", icon: "hugeicons:folder-01" },
        { group: "Management", title: "Vendors", href: "/vendors", icon: "hugeicons:delivery-truck-01" },
        
        { group: "Finance", title: "Expenses", href: "/expenses", icon: "hugeicons:money-bag-01" },
        { group: "Finance", title: "Categories", href: "/categories", icon: "hugeicons:tag-01" },
      ],
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between h-16 px-2">
        {navItems.map((item) => {
          let isActive = false;
          if (item.href) {
            isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          } else if (item.subItems) {
            isActive = item.subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + "/"));
          }

          return (
            <MobileNavItem
              key={item.title}
              title={item.title}
              icon={item.icon}
              href={item.href}
              subItems={item.subItems}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}
