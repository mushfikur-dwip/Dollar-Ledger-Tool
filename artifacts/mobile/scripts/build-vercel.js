const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const distDir = path.join(projectRoot, "dist");
const vercelOutputDir = path.join(workspaceRoot, ".vercel", "output");
const vercelStaticDir = path.join(vercelOutputDir, "static");

console.log("Building Expo web...");
execSync("pnpm exec expo export --platform web", {
  stdio: "inherit",
  cwd: projectRoot,
});

console.log("Setting up Vercel output structure...");
if (fs.existsSync(vercelOutputDir)) {
  fs.rmSync(vercelOutputDir, { recursive: true });
}
fs.mkdirSync(vercelStaticDir, { recursive: true });

function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Copying dist to .vercel/output/static...");
copyDir(distDir, vercelStaticDir);

const config = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" },
  ],
};

fs.writeFileSync(
  path.join(vercelOutputDir, "config.json"),
  JSON.stringify(config, null, 2)
);

console.log("Vercel output ready at .vercel/output/");
