// One JSON error shape for every endpoint: { error: { code, message, details? } } (docs/API.md).
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SESSION_NOT_ACTIVE"
  | "BANK_EXHAUSTED"
  | "MODEL_OUTPUT_INVALID"
  | "MODEL_UNAVAILABLE"
  | "DB_UNAVAILABLE"
  | "INTERNAL";

export const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  SESSION_NOT_ACTIVE: 409,
  BANK_EXHAUSTED: 409,
  MODEL_OUTPUT_INVALID: 502,
  MODEL_UNAVAILABLE: 503,
  DB_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Model failures from src/services/ai.ts. Kept here so the error mapper has no Mastra import. */
export class ModelError extends Error {
  constructor(
    public code: "MODEL_UNAVAILABLE" | "MODEL_OUTPUT_INVALID",
    message: string,
  ) {
    super(message);
  }
}

const DB_DOWN_CODES = ["ECONNREFUSED", "P1001", "P1002", "P1017"];

function isDbDown(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  const text = JSON.stringify(e, Object.getOwnPropertyNames(e ?? {})) ?? "";
  return DB_DOWN_CODES.some((c) => text.includes(c)) && !text.includes("11434");
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof ModelError) return new ApiError(e.code, e.message);
  if (e instanceof ZodError) return new ApiError("VALIDATION_ERROR", "Invalid input", e.issues);
  if (e instanceof SyntaxError) return new ApiError("VALIDATION_ERROR", "Body is not valid JSON");
  if (isDbDown(e)) {
    return new ApiError("DB_UNAVAILABLE", "Database is not reachable. Run `docker compose up -d`.");
  }
  return new ApiError("INTERNAL", "Something went wrong");
}

export function toResponse(e: unknown): Response {
  const err = toApiError(e);
  if (err.code === "INTERNAL") console.error(e);
  const body: { code: ErrorCode; message: string; details?: unknown } = { code: err.code, message: err.message };
  if (err.details !== undefined) body.details = err.details;
  return Response.json({ error: body }, { status: STATUS[err.code] });
}

/** Parse a JSON body with a Zod schema; throws VALIDATION_ERROR on bad JSON or bad shape. */
export async function parseBody<T>(req: Request, schema: { parse: (v: unknown) => T }): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("VALIDATION_ERROR", "Body is not valid JSON");
  }
  return schema.parse(raw);
}
