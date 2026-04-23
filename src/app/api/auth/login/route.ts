import { NextResponse } from "next/server";
import { domainErrorResponse, invalidJsonResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";
import { loginUser } from "@/lib/auth-service";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsedBody = loginSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    const result = await loginUser(parsedBody.data);

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return serverErrorResponse();
  }
}
