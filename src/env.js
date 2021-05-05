import os from "os";

export function isWsl() {
    if (process.platform !== "linux") {
        return false;
    }

    if (os.release().toLowerCase().includes("microsoft")) {
        return true;
    }

    try {
        return fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
    } catch (_) {
        return false;
    }
}

export function getRunningPlatform() {
    if (isWsl()) {
        return "wsl";
    }
    let platform = os.platform();
    return platform;
}

export function hasCommand(cmd) {}

export function isUnixPath(p) {
    return path.parse(p).root === "/";
}

export function toWSLPath(p) {
    let cmd = `wslpath -a '${p.replace(/\\/g, "\\\\")}'`;
    return _execSync(cmd);
}
