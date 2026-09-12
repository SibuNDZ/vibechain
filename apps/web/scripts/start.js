const { existsSync } = require("fs");
const { spawn } = require("child_process");
const path = require("path");

const webRoot = path.join(__dirname, "..");
const candidates = [
  path.join(webRoot, ".next", "standalone", "apps", "web", "server.js"),
  path.join(webRoot, ".next", "standalone", "server.js"),
  path.join(process.cwd(), "apps", "web", "server.js"),
  path.join(process.cwd(), "server.js"),
];

const entry = candidates.find((file) => existsSync(file));

if (!entry) {
  console.error("Could not find Next.js standalone server.js");
  process.exit(1);
}

const child = spawn(process.execPath, [entry], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
    PORT: process.env.PORT || "3000",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
