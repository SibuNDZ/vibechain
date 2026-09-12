const { existsSync } = require("fs");
const { spawn } = require("child_process");
const path = require("path");

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const webRoot = path.join(__dirname, "..");
const standaloneRoot = path.join(webRoot, ".next", "standalone");
const port = process.env.PORT || "3000";

const layouts = [
  {
    cwd: standaloneRoot,
    entry: path.join("apps", "web", "server.js"),
    abs: path.join(standaloneRoot, "apps", "web", "server.js"),
  },
  {
    cwd: standaloneRoot,
    entry: "server.js",
    abs: path.join(standaloneRoot, "server.js"),
  },
  {
    cwd: process.cwd(),
    entry: path.join("apps", "web", "server.js"),
    abs: path.join(process.cwd(), "apps", "web", "server.js"),
  },
  {
    cwd: process.cwd(),
    entry: "server.js",
    abs: path.join(process.cwd(), "server.js"),
  },
];

const resolved = layouts.find((layout) => existsSync(layout.abs));

if (!resolved) {
  fail(
    `Could not find Next.js standalone server.js. Looked in:\n${layouts
      .map((layout) => `  - ${layout.abs}`)
      .join("\n")}`
  );
}

log(
  `Starting Next standalone ${resolved.abs} (cwd=${resolved.cwd}, port=${port}, host=0.0.0.0)`
);

const child = spawn(process.execPath, [resolved.entry], {
  cwd: resolved.cwd,
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: "0.0.0.0",
    PORT: port,
  },
});

child.on("error", (error) => {
  fail(`Failed to start standalone server: ${error.message}`);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
