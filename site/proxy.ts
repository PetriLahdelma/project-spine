import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request CSP nonce proxy.
 *
 * We generate a fresh nonce per request, pass it to the downstream render via
 * the `x-nonce` request header (Next 16 SSR picks this up automatically and
 * stamps it onto its own inline script tags), and emit a matching
 * Content-Security-Policy response header.
 *
 * Scope of the nonce: `script-src` only. Scripts are the high-blast-radius
 * surface, and `strict-dynamic` + nonce is how we keep `'unsafe-inline'` off
 * scripts without breaking Next's RSC payload.
 *
 * Style-src is intentionally nonce-free: `'self' 'unsafe-inline'` is the
 * documented posture in SECURITY.md. React's inline `style={{…}}` and Next's
 * styled-jsx both rely on inline styles, and CSP Level 3 voids
 * `'unsafe-inline'` as soon as a nonce is present on the same directive —
 * the result is style attributes silently dropped on SSR HTML but re-applied
 * via CSSOM after SPA nav, so identical source produced divergent renders.
 * There is no user-controlled style injection surface, so inline styles are
 * not a practical XSS vector here.
 *
 * This replaces the static CSP from next.config.mjs on every HTML route.
 * API routes don't need inline scripts — the nonce is irrelevant for them,
 * but emitting it does no harm and keeps the CSP uniform.
 *
 * Static asset fetches (next/static chunks, images, fonts) are excluded via
 * the matcher below so the proxy isn't invoked for every byte of bundle.
 */
export function proxy(request: NextRequest) {
  // Uint8Array → base64 via btoa. 16 bytes → 24-char nonce.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCharCode(...bytes));

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com https://registry.npmjs.org https://vitals.vercel-insights.com https://va.vercel-scripts.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://github.com",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  const csp = cspDirectives.join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  // Expose the incoming pathname to RSC so layouts can highlight the active
  // nav link without needing a client component.
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (shouldNoIndex(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function shouldNoIndex(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/login" ||
    pathname === "/logout" ||
    pathname === "/device" ||
    pathname.startsWith("/device/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/w/") ||
    pathname.startsWith("/workspaces/")
  );
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - _next/static  (Next.js build output)
     *   - _next/image   (Next.js image optimizer)
     *   - favicon.ico   (static asset)
     *   - *.png/*.jpg/*.svg at the root (static branding assets)
     * The CSP applies to HTML documents and API routes; static assets carry
     * their own Content-Type and don't execute scripts.
     */
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
