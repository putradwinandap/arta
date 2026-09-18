import { FormEvent } from "react";
import { AuthForm } from "./AuthForm";

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

export function AuthErrorState(props: Props) {
  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <AuthForm {...props} />
      </section>
    </main>
  );
}
