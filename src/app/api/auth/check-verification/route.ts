import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const emailParam = url.searchParams.get("email");

    let emailToTest = emailParam ? emailParam.toLowerCase().trim() : null;

    if (!emailToTest) {
      const session = await auth();
      if (session?.user?.email) {
        emailToTest = session.user.email.toLowerCase().trim();
      }
    }

    if (!emailToTest) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: emailToTest },
      select: { emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ verified: false }, { status: 404 });
    }

    return NextResponse.json({
      verified: Boolean(user.emailVerified),
    });
  } catch (error) {
    console.error("Check verification error:", error);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
