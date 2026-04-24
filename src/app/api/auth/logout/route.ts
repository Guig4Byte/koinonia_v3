import { NextResponse } from "next/server";
import { serverErrorResponse, validationErrorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { logoutSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: true });
    }

    const parsedBody = logoutSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    await prisma.refreshToken.deleteMany({
      where: {
        token: parsedBody.data.refreshToken,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return serverErrorResponse();
  }
}
