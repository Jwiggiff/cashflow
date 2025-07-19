"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "./privacy-provider";

export function PrivacyToggle() {
  const { isPrivate, togglePrivacy } = usePrivacy();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePrivacy}
          className="h-8 w-8"
          aria-label={isPrivate ? "Show balances" : "Hide balances"}
        >
          {isPrivate ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isPrivate ? "Show balances" : "Hide balances"}</p>
      </TooltipContent>
    </Tooltip>
  );
} 