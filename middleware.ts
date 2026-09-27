export { auth as middleware } from "@/lib/auth";

export const config = {
  runtime: "nodejs",
  matcher: [
    "/accounts/:path*",
    "/categories/:path*",
    "/dashboard/:path*",
    "/recurring/:path*",
    "/settings/:path*",
    "/transactions/:path*",
  ],
};
