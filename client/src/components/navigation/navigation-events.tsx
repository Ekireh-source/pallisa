"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useGlobalLoading } from "@/providers/global-loading-provider";

function isClientNavigationClick(event: MouseEvent): boolean {
	if (event.defaultPrevented) return false;
	if (event.button !== 0) return false;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

	const target = event.target as HTMLElement | null;
	const anchor = target?.closest("a");

	if (!anchor) return false;
	if (anchor.target && anchor.target !== "_self") return false;
	if (anchor.hasAttribute("download")) return false;

	const href = anchor.getAttribute("href");
	if (!href || href.startsWith("#")) return false;
	if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

	const destination = new URL(anchor.href, window.location.href);
	if (destination.origin !== window.location.origin) return false;

	const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	const nextUrl = `${destination.pathname}${destination.search}${destination.hash}`;

	return currentUrl !== nextUrl;
}

export default function NavigationEvents() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { setLoading } = useGlobalLoading();
	const search = searchParams.toString();

	useEffect(() => {
		setLoading(false);
	}, [pathname, search, setLoading]);

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			if (isClientNavigationClick(event)) {
				setLoading(true);
			}
		};

		document.addEventListener("click", handleClick, true);

		return () => {
			document.removeEventListener("click", handleClick, true);
		};
	}, [setLoading]);

	return null;
}
