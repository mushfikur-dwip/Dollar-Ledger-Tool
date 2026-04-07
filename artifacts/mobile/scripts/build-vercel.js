const { execSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

console.log("Building Expo web...");
execSync("pnpm exec expo export --platform web", {
  stdio: "inherit",
  cwd: projectRoot,
});

console.log("Build complete. Output at: " + path.join(projectRoot, "dist"));
