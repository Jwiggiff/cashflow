"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { usePrivacy } from "./privacy-provider";

export function PrivacyToggle() {
  const { isPrivate, togglePrivacy, isLoading } = usePrivacy();

  // During loading, use the default state (true) to match server-side rendering
  const effectiveIsPrivate = isLoading ? true : isPrivate;

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePrivacy}
          className="h-8 w-8"
          aria-label={effectiveIsPrivate ? "Show balances" : "Hide balances"}
        >
          {effectiveIsPrivate ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{effectiveIsPrivate ? "Show balances" : "Hide balances"}</p>
      </TooltipContent>
    </Tooltip>
  );
} 