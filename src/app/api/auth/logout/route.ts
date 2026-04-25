import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { logoutUser } from "@/lib/auth-service";
import { logoutSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsedBody = logoutSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    const result = await logoutUser(parsedBody.data);

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return serverErrorResponse();
  }
}
