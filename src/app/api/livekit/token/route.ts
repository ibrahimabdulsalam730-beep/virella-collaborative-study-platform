import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // 1. Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Email verification gate
    if (!session.user.emailVerified) {
      return NextResponse.json(
        {
          error: "EMAIL_VERIFICATION_REQUIRED",
          message: "Email verification is required to participate in live audio/video rooms.",
        },
        { status: 403 }
      );
    }

    // 3. Status gate: block suspended users
    if (session.user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error: "ACCOUNT_SUSPENDED",
          message: "Your account is suspended. You cannot participate in live video rooms.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "roomId query parameter is required" },
        { status: 400 }
      );
    }

    const rawApiKey = process.env.LIVEKIT_API_KEY;
    const rawApiSecret = process.env.LIVEKIT_API_SECRET;
    const isConfigured = Boolean(
      rawApiKey &&
      rawApiKey.trim() !== "" &&
      rawApiKey !== "devkey" &&
      rawApiSecret &&
      rawApiSecret.trim() !== "" &&
      rawApiSecret !== "secret_dev_key_livekit_secure_hash_32b"
    );

    if (!isConfigured) {
      return NextResponse.json({
        isConfigured: false,
        token: null,
        url: null,
        roomId,
        identity: session.user.id,
        message: "LiveKit is in local preview mode. Provide LIVEKIT_API_KEY in .env.local for multi-user WebRTC.",
      });
    }

    const apiKey = rawApiKey!;
    const apiSecret = rawApiSecret!;
    const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://virella-study.livekit.cloud";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: session.user.name || "Scholar",
      metadata: JSON.stringify({
        role: session.user.role,
        image: session.user.image,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      isConfigured: true,
      token,
      url: wsUrl,
      roomId,
      identity: session.user.id,
    });
  } catch (error) {
    console.error("LiveKit token generation failed:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Could not generate LiveKit access token" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // 1. Authentication check
    if (!session?.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Email verification gate
    if (!session.user.emailVerified) {
      return NextResponse.json(
        {
          error: "EMAIL_VERIFICATION_REQUIRED",
          message: "Email verification is required to participate in live audio/video rooms.",
        },
        { status: 403 }
      );
    }

    // 3. Status gate: block suspended users
    if (session.user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error: "ACCOUNT_SUSPENDED",
          message: "Your account is suspended. You cannot participate in live video rooms.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const roomId = body.roomId;

    if (!roomId) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "roomId is required in JSON body" },
        { status: 400 }
      );
    }

    const rawApiKey = process.env.LIVEKIT_API_KEY;
    const rawApiSecret = process.env.LIVEKIT_API_SECRET;
    const isConfigured = Boolean(
      rawApiKey &&
      rawApiKey.trim() !== "" &&
      rawApiKey !== "devkey" &&
      rawApiSecret &&
      rawApiSecret.trim() !== "" &&
      rawApiSecret !== "secret_dev_key_livekit_secure_hash_32b"
    );

    if (!isConfigured) {
      return NextResponse.json({
        isConfigured: false,
        token: null,
        url: null,
        roomId,
        identity: session.user.id,
        message: "LiveKit is in local preview mode. Provide LIVEKIT_API_KEY in .env.local for multi-user WebRTC.",
      });
    }

    const apiKey = rawApiKey!;
    const apiSecret = rawApiSecret!;
    const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://virella-study.livekit.cloud";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: session.user.name || "Scholar",
      metadata: JSON.stringify({
        role: session.user.role,
        image: session.user.image,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      isConfigured: true,
      token,
      url: wsUrl,
      roomId,
      identity: session.user.id,
    });
  } catch (error) {
    console.error("LiveKit token generation failed:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Could not generate LiveKit access token" },
      { status: 500 }
    );
  }
}
