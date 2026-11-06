import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const files = ["garden-planner.js", "THIRD_PARTY_NOTICES.txt"].map((name) =>
  resolve("../custom_components/garden_planner/www", name),
);
const previous = files.map((path) => readFileSync(path));
const result = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "build"],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
for (let i = 0; i < files.length; i++) {
  if (!previous[i].equals(readFileSync(files[i])))
    throw new Error(`Committed build differs: ${files[i]}`);
}
console.log("Frontend bundle and license notices reproduce byte-for-byte.");
