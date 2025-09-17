"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Fingerprint, Plus, AlertCircle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/webauthn";
import { useSession } from "next-auth/react";

export function PasskeysForm() {
  const [isAdding, setIsAdding] = useState(false);
  const { data: session } = useSession();
  
  const hasEmail = session?.user?.email && session.user.email.trim() !== "";

  const addPasskey = async () => {
    setIsAdding(true);
    try {
      await signIn("passkey", { action: "register" });
      toast.success("Passkey registration initiated");
    } catch (error) {
      console.error("Error adding passkey:", error);
      toast.error("Failed to add passkey");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Add a passkey for secure authentication. Passkeys allow you to sign in using biometric authentication or a security key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasEmail ? (
          <div className="flex items-center gap-2 p-4 text-sm bg-destructive/10 border border-destructive rounded-lg">
            <Mail className="h-4 w-4" />
            <div>
              <p className="font-medium">Email required for passkeys</p>
              <p className="text-xs text-destructive mt-1">
                You need to add an email address to your account before you can register passkeys.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            Passkeys are stored securely on your device and can be used for biometric authentication or with a security key.
          </div>
        )}

        <Button
          onClick={addPasskey}
          disabled={isAdding || !hasEmail}
          className="w-full"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding passkey...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Passkey
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> Passkeys are stored securely on your device and can be used for biometric authentication or with a security key.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
