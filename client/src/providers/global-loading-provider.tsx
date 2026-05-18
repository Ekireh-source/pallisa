"use client";

import type React from "react";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface GlobalLoadingContextValue {
	loading: boolean;
	setLoading: (value: boolean) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
	const [loading, setLoadingState] = useState(false);

	const setLoading = useCallback((value: boolean) => {
		setLoadingState(value);
	}, []);

	const value = useMemo(
		() => ({
			loading,
			setLoading,
		}),
		[loading, setLoading],
	);

	return <GlobalLoadingContext.Provider value={value}>{children}</GlobalLoadingContext.Provider>;
}

export function useGlobalLoading() {
	const context = useContext(GlobalLoadingContext);

	if (!context) {
		throw new Error("useGlobalLoading must be used within LoadingProvider");
	}

	return context;
}
