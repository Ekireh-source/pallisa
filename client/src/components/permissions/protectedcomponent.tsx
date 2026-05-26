"use client";


import { PERMISSION_CODES } from "@/codes";
import { hasPermission } from "@/lib/permissions";
// import { selectUser } from "@/store/auth/selectors";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface ProtectedComponentProps {
	permissionCode: PERMISSION_CODES | PERMISSION_CODES[] | null;
	permissionMode?: "all" | "any";
	fallback?: React.ReactNode;
	children: React.ReactNode;
}

export default function ProtectedComponent({
	permissionCode,
	permissionMode = "all",
	fallback,
	children,
}: ProtectedComponentProps) {
	const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

	const requiredPermissionCodes = Array.isArray(permissionCode)
		? permissionCode
		: !!permissionCode
			? [permissionCode]
			: [];
	// const currentUser = useSelector(selectUser);

	useEffect(() => {
		checkPermissions();
	}, [requiredPermissionCodes]);

	const checkPermissions = () => {
		const allowed =
			permissionMode === "all"
				? requiredPermissionCodes.every((code) => hasPermission(code))
				: requiredPermissionCodes.some((code) => hasPermission(code));
		setIsAllowed(allowed);
	};

	if (!isAllowed) return fallback || null;

	return <>{children}</>;
}
