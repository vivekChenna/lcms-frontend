import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { useDronaSignIn } from "@/lib/auth";
import { fetchDronaEmail } from "@/lib/drona-sdk";

function message(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : "Drona sign-in could not be completed.";
}

/** Signs in with the Drona profile as soon as it is shown; the button retries after a failure. */
export function DronaSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const signIn = useDronaSignIn();
  const connect = useMutation({
    mutationFn: async () => signIn.mutateAsync({ email: await fetchDronaEmail() }),
    onSuccess: onSignedIn,
  });
  const attempted = useRef(false);
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    connect.mutate();
  }, [connect]);

  return (
    <div className="space-y-4" data-testid="drona-sign-in">
      <p className="text-sm text-muted-foreground">Use your existing Drona session.</p>
      {connect.isError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {message(connect.error)}
        </p>
      )}
      <Button
        type="button"
        className="h-11 w-full"
        loading={connect.isPending}
        loadingText="Checking Drona session…"
        onClick={() => connect.mutate()}
      >
        Continue with Drona
        <ArrowRight aria-hidden />
      </Button>
    </div>
  );
}
