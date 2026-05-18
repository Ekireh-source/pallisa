import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiGet } from "./api";
import { IPaginatedResponse } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function forceUrlToHttps(url: string): string {
  const FORCE_HTTPS = process.env.NEXT_PUBLIC_FORCE_HTTPS
    ? process.env.NEXT_PUBLIC_FORCE_HTTPS === "true"
    : true;

  if (!FORCE_HTTPS) {
    return url;
  }

  // Avoid forcing HTTPS for localhost to prevent CORS/Connection errors
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return url;
  }

  return url.replace(/^http:\/\//i, "https://");
}



export async function getPaginatedFromUrl<T>({ url }: { url: string }): Promise<IPaginatedResponse<T>> {
	const response = await apiGet(url);
	return response as IPaginatedResponse<T>;
}