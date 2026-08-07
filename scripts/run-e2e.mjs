import { spawn, spawnSync } from "node:child_process";
import { platform } from "node:os";

const node = process.execPath;
const server = spawn(
  node,
  ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1"],
  {
    detached: platform() !== "win32",
    stdio: "ignore",
  },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:3000");
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Production server did not start within 30 seconds");
}

function stopServer() {
  if (platform() === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
}

let exitCode = 1;
try {
  await waitForServer();
  const forwardedArgs = process.argv.slice(2);
  const runs = forwardedArgs.length
    ? [forwardedArgs]
    : [["--project=chromium"], ["--project=mobile-webkit", "--workers=1"]];

  exitCode = 0;
  for (const args of runs) {
    const test = spawn(
      node,
      ["node_modules/@playwright/test/cli.js", "test", ...args],
      { stdio: "inherit" },
    );
    exitCode = await new Promise((resolve) =>
      test.on("exit", (code) => resolve(code ?? 1)),
    );
    if (exitCode !== 0) break;
  }
} finally {
  stopServer();
}

process.exit(exitCode);
