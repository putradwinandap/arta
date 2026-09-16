import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadHouseholdBackup,
  joinHousehold,
  login,
  restoreHouseholdBackup,
} from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("centralized API requests", () => {
  it("sends typed login requests through the shared request boundary", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: "user-1", email: "user@example.test" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(login("user@example.test", "secret")).resolves.toEqual({
      id: "user-1",
      email: "user@example.test",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });

  it("preserves API error codes for invite redemption", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 409,
        json: async () => ({ error: "invite_already_used" }),
      })),
    );

    await expect(joinHousehold(" invite-token ")).rejects.toThrow(
      "invite_already_used",
    );
  });

  it("uses the restore confirmation header and blob boundary", async () => {
    const fetchMock = vi.fn(async (_path: string, init?: RequestInit) =>
      init?.method === "POST"
        ? { ok: true, status: 204, blob: async () => new Blob() }
        : { ok: true, status: 200, blob: async () => new Blob(["backup"]) },
    );
    vi.stubGlobal("fetch", fetchMock);

    await downloadHouseholdBackup("household-1");
    await restoreHouseholdBackup("household-1", '{"format":"backup"}');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/households/household-1/restore",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Arta-Restore-Confirm": "replace" }),
      }),
    );
  });
});
