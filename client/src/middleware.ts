import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that do not require authentication
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // If visiting a public path...
  if (isPublicPath) {
    // If we have a valid access token, redirect to dashboard
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (!isExpired) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (e) {
        // Invalid token structure, treat as unauthenticated
      }
    }
    return NextResponse.next();
  }

  // If visiting a private route...
  // 1. Check if access token is present and valid
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (!isExpired) {
        return NextResponse.next();
      }
    } catch (e) {
      // Invalid access token, fall through to refresh
    }
  }

  // 2. Access token is missing or expired. Try to refresh it on the server side!
  if (refreshToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const refreshResponse = await fetch(`${apiUrl}/accounts/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refresh_token=${refreshToken}`,
        },
      });

      if (refreshResponse.ok) {
        const res = NextResponse.next();
        // Propagate Set-Cookie headers from Django to the browser response
        const setCookieHeaders = refreshResponse.headers.getSetCookie 
          ? refreshResponse.headers.getSetCookie() 
          : [];
        
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          setCookieHeaders.forEach((cookieStr) => {
            // 1. Forward the exact cookie string from backend to browser response headers
            res.headers.append("Set-Cookie", cookieStr);
            
            // 2. Also register it on the NextResponse cookie jar so the active request has access
            try {
              const attributes = cookieStr.split(";").map(attr => attr.trim());
              const [first, ...rest] = attributes;
              const [name, ...valParts] = first.split("=");
              const value = valParts.join("=");
              
              const options: any = {
                path: "/",
              };
              
              rest.forEach(attr => {
                const lower = attr.toLowerCase();
                if (lower === "httponly") {
                  options.httpOnly = true;
                } else if (lower === "secure") {
                  options.secure = true;
                } else if (lower.startsWith("samesite=")) {
                  options.sameSite = lower.split("=")[1];
                } else if (lower.startsWith("path=")) {
                  options.path = attr.split("=")[1];
                } else if (lower.startsWith("max-age=")) {
                  options.maxAge = parseInt(attr.split("=")[1], 10);
                } else if (lower.startsWith("domain=")) {
                  options.domain = attr.split("=")[1];
                }
              });
              
              res.cookies.set(name, value, options);
            } catch (e) {
              console.error("Failed to parse set-cookie in middleware:", e);
            }
          });
        } else {
          const rawSetCookie = refreshResponse.headers.get("set-cookie");
          if (rawSetCookie) {
            res.headers.set("Set-Cookie", rawSetCookie);
          }
        }
        return res;
      }
    } catch (e) {
      console.error("Server-side token refresh error in Next.js middleware:", e);
    }
  }

  // 3. No valid credentials, redirect to login page
  const loginUrl = new URL("/login", request.url);
  // Optional: preserve the original path to redirect back after login
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

// Matching Paths to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.css).*)",
  ],
};
