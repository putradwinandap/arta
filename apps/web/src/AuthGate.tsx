import { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { AuthErrorState } from "./components/auth/AuthErrorState";
import { AuthLoadingState } from "./components/auth/AuthLoadingState";
import { useAuthSession } from "./components/auth/useAuthSession";

type Props = { children: ReactNode };
export function AuthGate({ children }: Props) {
  const session = useAuthSession();
  if (session.loading) return <AuthLoadingState />;
  if (!session.user)
    return (
      <AuthErrorState
        mode={session.mode}
        email={session.email}
        password={session.password}
        saving={session.saving}
        error={session.error}
        onSubmit={session.submit}
        onEmailChange={session.setEmail}
        onPasswordChange={session.setPassword}
        onModeChange={session.toggleMode}
      />
    );
  return (
    <AppShell
      email={session.user.email}
      offline={session.offline}
      onLogout={() => void session.logout()}
    >
      <>
        {session.error && (
          <p className="alert" role="alert">
            {session.error}
          </p>
        )}
        {children}
      </>
    </AppShell>
  );
}
