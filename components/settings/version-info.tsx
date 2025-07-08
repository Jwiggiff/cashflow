"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VersionInfo, checkForLatestVersion } from "@/lib/version";
import {
  AlertCircle,
  Check,
  ExternalLink,
  GitBranch,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

interface VersionInfoProps {
  versionInfo: VersionInfo;
}

export function VersionInfoCard({ versionInfo }: VersionInfoProps) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setCheckError(null);
    
    const { version, error, releaseUrl } = await checkForLatestVersion();
    setLatestVersion(version);
    setReleaseUrl(releaseUrl || null);
    setCheckError(error);
    setIsChecking(false);
  };

  useEffect(() => {
    // Check for updates when component mounts
    checkForUpdates();
  }, []);

  const isUpToDate = latestVersion && versionInfo.version === latestVersion;
  const hasUpdate = latestVersion && versionInfo.version !== latestVersion;

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
              {isChecking && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Checking for updates...</span>
                </div>
              )}
              {!isChecking && isUpToDate && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-xs">Up to date</span>
                </div>
              )}
              {!isChecking && hasUpdate && (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  {releaseUrl ? (
                    <a
                      href={releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline flex items-center gap-1"
                    >
                      Update available: {latestVersion}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs">
                      Update available: {latestVersion}
                    </span>
                  )}
                </div>
              )}
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

            {checkError && (
              <div className="text-sm text-red-600">{checkError}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
