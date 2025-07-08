export interface VersionInfo {
  version: string;
  gitHash: string;
  buildDate: string;
  githubUrl: string;
}

export interface GitHubRelease {
  tag_name: string;
  html_url: string;
}

export async function getVersionInfo(): Promise<VersionInfo> {
  try {
    // Import version info directly from the JSON file
    const versionInfo = await import("./version.json");
    return versionInfo.default;
  } catch (error) {
    console.warn("Could not import version info from JSON file:", error);
  }

  // Fallback to unknown for everything
  return {
    version: "unknown",
    gitHash: "unknown",
    buildDate: new Date().toISOString(),
    githubUrl: "https://github.com/jwiggiff/cashflow",
  };
}

export async function checkForLatestVersion(): Promise<{
  version: string | null;
  error: string | null;
  releaseUrl?: string;
}> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/jwiggiff/cashflow/releases/latest"
    );
    if (response.ok) {
      const release: GitHubRelease = await response.json();
      return { 
        version: release.tag_name.replace("v", ""), 
        error: null,
        releaseUrl: release.html_url
      };
    } else {
      return { version: null, error: "Failed to fetch latest version" };
    }
  } catch {
    return { version: null, error: "Network error while checking for updates" };
  }
}
