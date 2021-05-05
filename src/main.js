import fs from "fs";
import os from "os";
import path from "path";
import childProcess from "child_process";
import * as env from "./env.js";
import unzipper from "unzipper";
import chokidar from "chokidar";
import c from "ansi-colors";

console.clear();

const CONFIG_PATH = "./config.json";

// setup default configuration

class ConfigDefault {
    constructor() {
        let platformDefaults = {
            wsl: "/mnt/c/Default/Downloads",
            win32: "C:\\Users\\Default\\Downloads",
            darwin: "~/Downloads",
            linux: "~/Downloads",
        };
        this.downloadsPath = platformDefaults[env.getRunningPlatform()] || "";
        this.deleteZipFileAfterwards = true;
    }
}

let config;

if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH));
} else {
    console.log(`Config file has been created at ${CONFIG_PATH}.`);
    config = new ConfigDefault();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
}

// WSL warning (fs.watch is broken on WSL2)
if (env.isWsl()) {
    console.warn(c.yellow("Warning: this program may not work properly on WSL"));
}

const watcher = chokidar.watch(config.downloadsPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    depth: 1,
});

function sizeDescriptor(size) {
    const k = 1024;
    if (size >= k * k) {
        return (size / (k * k)).toFixed(1) + " MiB";
    }
    if (size >= k) {
        return (size / k).toFixed(1) + " KiB";
    }
    return size + " bytes";
}

function awaitPotentiallyBusyResource(path) {
    let stream;
    while (true) {
        try {
            stream = fs.createReadStream(path);
        } catch (err) {
            if (err.code === "EBUSY") {
                continue;
            } else {
                throw err;
            }
        } finally {
            if (stream) {
                return stream;
            }
        }
    }
}

watcher.on("ready", () => {
    console.log(c.green("Ready."));

    watcher.on("add", (newPath) => {
        // ensure that the new file is in the base directory
        if (path.dirname(path.resolve(newPath)) !== path.resolve(config.downloadsPath)) return;
        // ensure that the new file is, in fact, a zip file
        if (path.extname(newPath) !== ".zip") return;

        // determine a unique name for the new file
        let outDir = path.join(config.downloadsPath, path.parse(newPath).name);
        while (fs.existsSync(outDir)) {
            outDir = outDir + "_1";
        }
        // log
        let sizeDescription = c.magenta(`(${sizeDescriptor(fs.statSync(newPath).size)} compressed)`);
        process.stdout.write(`Unzipping ${c.cyan(newPath)} ${sizeDescription}...`);

        // try to unzip the file
        awaitPotentiallyBusyResource(newPath)
            .pipe(unzipper.Extract({ path: outDir }))
            .on("error", (err) => {
                console.log();
                console.log(c.red(`An error occurred while trying to unzip file ${c.magenta(newPath)}: ${err}`));
            })
            .on("close", () => {
                // this function is called if the file was unzipped successfully
                console.log(c.green("done"));

                if (config.deleteZipFileAfterwards) fs.unlinkSync(newPath);
            });
    });
});
