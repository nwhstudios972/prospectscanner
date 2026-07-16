import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      est_admin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    est_admin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    est_admin?: boolean;
  }
}
