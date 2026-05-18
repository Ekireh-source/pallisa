export interface NavItem {
	title: string;
    href: string;
    icon?: React.ReactNode;
    submenu?: NavItem[];
    requiredPermission?: string | string[];
}