import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!login|mot-de-passe-oublie|api/auth|api/mot-de-passe-oublie|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)",
  ],
};
