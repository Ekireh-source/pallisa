"use client";

import type React from "react";

import Link from "next/link";

import { useGlobalLoading } from "@/providers/global-loading-provider";

type AppLinkProps = React.ComponentProps<typeof Link>;

export function AppLink({ onClick, ...props }: AppLinkProps) {
    const { setLoading } = useGlobalLoading();

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);

        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        setLoading(true);
    };

    return <Link {...props} onClick={handleClick} />;
}

export default AppLink;
