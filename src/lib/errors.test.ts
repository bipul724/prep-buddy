import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { ApiError, ModelError, toResponse } from "./errors";

describe("toResponse", () => {
  it("maps ModelError(MODEL_UNAVAILABLE) to 503 with that code", async () => {
    const res = toResponse(new ModelError("MODEL_UNAVAILABLE", "Ollama is not running."));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: { code: "MODEL_UNAVAILABLE", message: "Ollama is not running." } });
  });
  it("maps MODEL_OUTPUT_INVALID to 502", () => {
    expect(toResponse(new ModelError("MODEL_OUTPUT_INVALID", "bad")).status).toBe(502);
  });
  it("maps ZodError to 400 VALIDATION_ERROR with details", async () => {
    const res = toResponse(new ZodError([]));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });
  it("maps BANK_EXHAUSTED to 409", () => {
    expect(toResponse(new ApiError("BANK_EXHAUSTED", "done")).status).toBe(409);
  });
  it("maps ECONNREFUSED on the DB port to DB_UNAVAILABLE", async () => {
    const e = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5433"), { code: "ECONNREFUSED" });
    expect((await toResponse(e).json()).error.code).toBe("DB_UNAVAILABLE");
  });
  it("hides unknown errors as INTERNAL", async () => {
    const orig = console.error;
    console.error = () => {};
    const res = toResponse(new Error("secret detail"));
    console.error = orig;
    expect(res.status).toBe(500);
    expect((await res.json()).error.message).not.toContain("secret");
  });
});
