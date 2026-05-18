"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useGlobalLoading } from "@/providers/global-loading-provider";

type AppRouter = ReturnType<typeof useRouter>;
type PushArgs = Parameters<AppRouter["push"]>;
type ReplaceArgs = Parameters<AppRouter["replace"]>;

export function useAppRouter(): AppRouter {
	const router = useRouter();
	const [, startTransition] = useTransition();
	const { setLoading } = useGlobalLoading();

	const push = useCallback(
		(...args: PushArgs) => {
			setLoading(true);
			startTransition(() => {
				router.push(...args);
			});
		},
		[router, setLoading, startTransition],
	);

	const replace = useCallback(
		(...args: ReplaceArgs) => {
			setLoading(true);
			startTransition(() => {
				router.replace(...args);
			});
		},
		[router, setLoading, startTransition],
	);

	return useMemo(
		() => ({
			...router,
			push,
			replace,
		}),
		[router, push, replace],
	);
}
