"use client";

import { AuthBrand } from "@/components/auth/auth-brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { signIn as signInWithPasskey } from "next-auth/webauthn";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// True only when launched from the home-screen icon (installed PWA), not a
// regular browser tab on phone or desktop - `display-mode: standalone` is
// the standard way to detect this; `navigator.standalone` is Safari's older,
// non-standard equivalent, still needed for some iOS versions.
function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const autoAttempted = useRef(false);

  const callbackUrl = params.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithPasskey = useCallback(
    async (options?: { silent?: boolean }) => {
      setIsLoading(true);
      if (!options?.silent) setError("");

      try {
        const result = await signInWithPasskey("passkey", { redirect: false });

        if (result?.error) {
          // A silent auto-attempt failing (no passkey saved yet, user
          // dismissed the system prompt, etc.) shouldn't show an error on a
          // page the user didn't explicitly ask to authenticate on - they
          // still have the password form and the manual button right there.
          if (!options?.silent) {
            setError("An error occurred during sign in with passkey");
          }
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (error) {
        console.error(error);
        if (!options?.silent) {
          setError("An error occurred during sign in with passkey");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [callbackUrl, router]
  );

  // Auto-trigger the passkey prompt on launch, but only when installed as a
  // PWA (see isStandalonePwa above) - not in a regular browser tab on phone
  // or desktop, where popping a biometric prompt the instant the page loads
  // would feel like an unexpected interruption rather than "the app opening."
  // Only attempted once per mount (autoAttempted ref) - a failed/dismissed
  // attempt falls back to the normal manual button instead of retrying in a
  // loop. Also skipped right after an explicit sign-out (see
  // components/user-section.tsx's `signedOut` redirect param) - without
  // this, signing out would immediately re-prompt Face ID and sign back in,
  // making it impossible to actually log out or switch accounts.
  useEffect(() => {
    if (autoAttempted.current) return;
    if (params.get("signedOut")) return;
    if (!isStandalonePwa()) return;
    if (typeof window.PublicKeyCredential === "undefined") return;
    autoAttempted.current = true;
    handleSignInWithPasskey({ silent: true });
  }, [handleSignInWithPasskey, params]);

  return (
    <div className="flex h-full items-center justify-center bg-pattern px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <AuthBrand />
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              Sign in
            </CardTitle>
            <CardDescription className="text-center">
              Enter a username and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => handleSignInWithPasskey()}
              >
                <Fingerprint className="size-4" />
                Sign in with Passkey
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
