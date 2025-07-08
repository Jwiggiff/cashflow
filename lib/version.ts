export interface VersionInfo {
  version: string;
  gitHash: string;
  buildDate: string;
  githubUrl: string;
}

export async function getVersionInfo(): Promise<VersionInfo> {
  try {
    // Import version info directly from the JSON file
    const versionInfo = await import('./version.json');
    return versionInfo.default;
  } catch (error) {
    console.warn('Could not import version info from JSON file:', error);
  }

  // Fallback to unknown for everything
  return {
    version: 'unknown',
    gitHash: 'unknown',
    buildDate: new Date().toISOString(),
    githubUrl: 'https://github.com/jwiggiff/cashflow',
  };
} 