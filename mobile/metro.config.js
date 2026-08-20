// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// The Convex functions and their generated types live in the web app at the
// repo root, so Metro has to watch outside this folder to pick them up.
config.watchFolders = [
  path.resolve(workspaceRoot, "convex"),
  path.resolve(workspaceRoot, "src/lib"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@convex": path.resolve(workspaceRoot, "convex"),
  // Pure helpers (currency/date formatting, CSV, country list) are shared
  // with the web app rather than duplicated, so the two can't drift.
  "@shared": path.resolve(workspaceRoot, "src/lib"),
};

config.resolver.disableHierarchicalLookup = false;

// `bun run preview` swaps Convex and Firebase for fixtures so the whole UI can
// be rendered in a browser without a backend or a signed-in account.
if (process.env.EXPO_PUBLIC_PREVIEW === "1") {
  const previewRoot = path.resolve(projectRoot, "preview");
  config.watchFolders.push(previewRoot);

  const original = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "convex/react") {
      return {
        type: "sourceFile",
        filePath: path.resolve(previewRoot, "mock-convex.tsx"),
      };
    }
    if (moduleName.endsWith("/lib/firebase") || moduleName === "@/lib/firebase") {
      return {
        type: "sourceFile",
        filePath: path.resolve(previewRoot, "mock-firebase.ts"),
      };
    }
    return (original ?? context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
