import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "./AuthGate";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AuthGate offline recovery", () => {
  it("keeps the last authenticated user when auth validation cannot reach the server", async () => {
    localStorage.setItem(
      "arta.authUser",
      JSON.stringify({ id: "user-1", email: "family@example.com" }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    render(
      <AuthGate>
        <p>dashboard</p>
      </AuthGate>,
    );
    expect(await screen.findByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText(/family@example.com/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/offline mode/i);
  });

  it("does not restore the cached user after a server 401", async () => {
    localStorage.setItem(
      "arta.authUser",
      JSON.stringify({ id: "user-1", email: "family@example.com" }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 401,
            json: async () => ({ error: "unauthenticated" }),
          }) as Response,
      ),
    );
    render(
      <AuthGate>
        <p>dashboard</p>
      </AuthGate>,
    );
    expect(
      await screen.findByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
  });

  it("clears auth and household snapshots on logout", async () => {
    localStorage.setItem(
      "arta.appSnapshot",
      JSON.stringify({ household: { id: "household-1" } }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/auth/me")
          return {
            ok: true,
            status: 200,
            json: async () => ({ id: "user-1", email: "family@example.com" }),
          } as Response;
        if (String(input) === "/api/auth/logout")
          return { ok: true, status: 204 } as Response;
        throw new Error(`unexpected fetch ${String(input)}`);
      }),
    );
    render(
      <AuthGate>
        <p>dashboard</p>
      </AuthGate>,
    );
    await screen.findByText("dashboard");
    screen.getAllByRole("button", { name: /log out/i })[0].click();
    await screen.findByRole("heading", { name: /welcome back/i });
    expect(localStorage.getItem("arta.authUser")).toBeNull();
    expect(localStorage.getItem("arta.appSnapshot")).toBeNull();
  });
});
