import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuickCaptureInbox } from "./QuickCaptureInbox";
import { localDb } from "./lib/db";

const householdId = "11111111-1111-4111-8111-111111111111";

beforeEach(async () => {
  vi.restoreAllMocks();
  await localDb.captures.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("QuickCaptureInbox offline retry boundaries", () => {
  it("keeps a local capture when sync receives 401", async () => {
    const capture = {
      id: "22222222-2222-4222-8222-222222222222",
      householdId,
      amountMinor: 25000,
      note: "Pending safely",
      capturedAt: new Date().toISOString(),
      syncStatus: "pending" as const,
    };
    await localDb.captures.put(capture);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).endsWith("/captures/")) {
          if (init?.method === "POST")
            return {
              ok: false,
              status: 401,
              json: async () => ({ error: "unauthenticated" }),
            } as Response;
          return {
            ok: true,
            status: 200,
            json: async () => ({ captures: [] }),
          } as Response;
        }
        throw new Error(`unexpected fetch ${String(input)}`);
      }),
    );
    render(
      <QuickCaptureInbox
        householdId={householdId}
        wallets={[]}
        onConfirmed={async () => {}}
      />,
    );
    await screen.findByText(/1 capture safely waiting/i);
    await waitFor(async () =>
      expect(await localDb.captures.get(capture.id)).toEqual(capture),
    );
  });
});
