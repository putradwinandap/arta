import { FormEvent } from "react";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
  email: string;
  password: string;
  saving: boolean;
  error: string;
  onSubmit: (event: FormEvent) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onModeChange: () => void;
};

export function AuthForm({
  mode,
  email,
  password,
  saving,
  error,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onModeChange,
}: Props) {
  return (
    <>
      <p className="eyebrow">Arta</p>
      <h1>{mode === "login" ? "Welcome back." : "Create your Arta account."}</h1>
      <p className="muted">
        Your household finance data is protected by your authenticated account and
        server-verified household membership.
      </p>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="stack-form">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      <button type="button" className="secondary" onClick={onModeChange}>
        {mode === "login"
          ? "Need an account? Register"
          : "Already have an account? Log in"}
      </button>
    </>
  );
}
