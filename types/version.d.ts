declare module '*/version.json' {
  const value: {
    version: string;
    gitHash: string;
    buildDate: string;
    githubUrl: string;
  };
  export default value;
} 