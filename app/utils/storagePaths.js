const os = require("os");
const path = require("path");
const fs = require("fs");

function canEnsureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a system-wide, writable directory for storing BroadbandX assets.
 *
 * Priority:
 * - BROADBANDX_STORAGE_ROOT env (supports legacy BROADADBANDX_STORAGE_ROOT)
 * - Windows: %PROGRAMDATA%\\broadbandx
 * - macOS: /Users/Shared/broadbandx
 * - Linux: /var/lib/broadbandx
 * - Fallback (all OS): os.tmpdir()/broadbandx
 */
function resolveBroadbandxStorageRoot() {
  const envPath =
    process.env.BROADBANDX_STORAGE_ROOT || process.env.BROADADBANDX_STORAGE_ROOT;
  if (envPath) return envPath;

  const candidates = [];
  const platform = process.platform;

  if (platform === "win32") {
    candidates.push(path.join(process.env.PROGRAMDATA || "C:\\ProgramData", "broadbandx"));
  } else if (platform === "darwin") {
    candidates.push(path.join(path.parse(os.homedir()).root, "Users", "Shared", "broadbandx"));
  } else {
    // linux and others
    candidates.push(path.join(path.parse(process.cwd()).root, "var", "lib", "broadbandx"));
  }

  candidates.push(path.join(os.tmpdir(), "broadbandx"));

  for (const c of candidates) {
    if (canEnsureDir(c)) return c;
  }

  // last resort
  return path.join(os.tmpdir(), "broadbandx");
}

module.exports = { resolveBroadbandxStorageRoot };

