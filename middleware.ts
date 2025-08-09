export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/accounts/:path*",
    "/categories/:path*",
    "/dashboard/:path*",
    "/recurring/:path*",
    "/settings/:path*",
    "/transactions/:path*",
  ],
};
