import { describe, expect, it } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getEdgeFunctionErrorCode } from "../errors";

function makeHttpError(body: unknown, parseable = true) {
  const context = {
    json: () =>
      parseable ? Promise.resolve(body) : Promise.reject(new Error("bad")),
  };
  return new FunctionsHttpError(context);
}

describe("getEdgeFunctionErrorCode", () => {
  it("reads the real error code out of the response body", async () => {
    const code = await getEdgeFunctionErrorCode(
      makeHttpError({ error: "current_password_incorrect" }),
    );
    expect(code).toBe("current_password_incorrect");
  });

  it("falls back to the generic message when the body has no error field", async () => {
    const code = await getEdgeFunctionErrorCode(makeHttpError({}));
    expect(code).toBe("Edge Function returned a non-2xx status code");
  });

  it("falls back to the generic message when the body is not JSON", async () => {
    const code = await getEdgeFunctionErrorCode(makeHttpError(null, false));
    expect(code).toBe("Edge Function returned a non-2xx status code");
  });

  it("falls back to a plain error's message for a non-HTTP error", async () => {
    const code = await getEdgeFunctionErrorCode(new Error("network down"));
    expect(code).toBe("network down");
  });

  it("falls back to unknown_error for a non-Error value", async () => {
    const code = await getEdgeFunctionErrorCode("not an error");
    expect(code).toBe("unknown_error");
  });
});
