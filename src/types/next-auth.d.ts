import { DefaultSession } from "next-auth";
import { Role, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role;
    status?: UserStatus;
    onboardingComplete?: boolean;
    emailVerified?: boolean | Date | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      status: UserStatus;
      onboardingComplete: boolean;
      emailVerified: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    status?: UserStatus;
    onboardingComplete?: boolean;
    emailVerified?: boolean;
  }
}

