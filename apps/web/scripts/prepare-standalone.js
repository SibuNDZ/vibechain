const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  fs.cpSync(src, dest, { recursive: true });
}

const webRoot = path.join(__dirname, "..");
const standaloneRoot = path.join(webRoot, ".next", "standalone");
const nestedServer = path.join(standaloneRoot, "apps", "web", "server.js");
const dest = fs.existsSync(nestedServer)
  ? path.join(standaloneRoot, "apps", "web")
  : standaloneRoot;

if (!fs.existsSync(path.join(dest, "server.js"))) {
  console.warn("standalone server.js not found; skipping asset copy");
  process.exit(0);
}

copyDir(path.join(webRoot, "public"), path.join(dest, "public"));
copyDir(path.join(webRoot, ".next", "static"), path.join(dest, ".next", "static"));
