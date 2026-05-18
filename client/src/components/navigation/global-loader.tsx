"use client";

import { useGlobalLoading } from "@/providers/global-loading-provider";

export default function GlobalLoader() {
	const { loading } = useGlobalLoading();

	if (!loading) {
		return null;
	}

	return (
		<div className="fixed top-0 left-0 right-0 z-50 h-1 overflow-hidden bg-transparent">
			<div className="h-full w-1/3 animate-loading-bar bg-primary" />
		</div>
	);
}
