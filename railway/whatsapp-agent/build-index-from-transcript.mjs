import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transcriptPath =
  "C:/Users/Admin/.cursor/projects/e-phoenix-events-2-backups-backup-2-antigravity-project-1-phoenix-brilliance/agent-transcripts/3f719408-35f5-4091-a0d0-f0695c0a392b/3f719408-35f5-4091-a0d0-f0695c0a392b.jsonl";

const lines = fs.readFileSync(transcriptPath, "utf8").split("\n");
let raw = null;
for (const line of lines) {
  if (!line.includes("mow , we have to fix the isssues from the index.js")) continue;
  try {
    const j = JSON.parse(line);
    const text = j.message?.content?.[0]?.text || "";
    const marker = "this is the current index.js : ";
    const idx = text.indexOf(marker);
    if (idx !== -1) raw = text.slice(idx + marker.length);
  } catch {
    /* skip */
  }
}

if (!raw) {
  console.error("Could not extract index.js from transcript");
  process.exit(1);
}

let fixed = fs.readFileSync(path.join(__dirname, "getMediaSlotPack.fixed.js"), "utf8");
fixed = fixed.replace(/^\/\/ DROP-IN:[\s\S]*?\n\n/, "").trim();

const start = raw.indexOf("async function getMediaSlotPack");
const end = raw.indexOf("\nasync function resolveEntityId", start);
if (start === -1 || end === -1) {
  console.error("Could not find function boundaries", start, end);
  process.exit(1);
}

const out = raw.slice(0, start) + fixed + raw.slice(end);
const dest = path.join(__dirname, "index.js");
fs.writeFileSync(dest, out);
console.log("Wrote", dest, "(" + out.length + " bytes)");
