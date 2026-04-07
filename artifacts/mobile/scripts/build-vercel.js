const { execSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const outputDir = path.join(workspaceRoot, "dist");

console.log("Building Expo web to workspace dist/...");
execSync(
  `pnpm exec expo export --platform web --output-dir ${outputDir}`,
  {
    stdio: "inherit",
    cwd: projectRoot,
  }
);

console.log("Build complete. Output at: " + outputDir);
