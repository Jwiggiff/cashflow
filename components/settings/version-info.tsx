"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VersionInfo } from "@/lib/version";
import { ExternalLink, GitBranch } from "lucide-react";

interface VersionInfoProps {
  versionInfo: VersionInfo;
}

export function VersionInfoCard({ versionInfo }: VersionInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Version Information
        </CardTitle>
        <CardDescription>
          Current application version and build information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Version:</span>
              <Badge variant="secondary">{versionInfo.version}</Badge>
            </div>

            <div className="flex gap-2">
              <span className="text-sm font-medium">Git Hash:</span>
              <a
                href={`https://github.com/jwiggiff/cashflow/commit/${versionInfo.gitHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline flex items-center gap-1"
              >
                {versionInfo.gitHash}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
