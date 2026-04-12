import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import docker from "../config/docker.js";
import { LANGUAGE_CONFIGS } from "../utils/languageConfig.js";
import logger from "../utils/logger.js";
import { PassThrough } from "stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const executeCode = async (code, language, onChunk, onEnd, onError) => {
  const config = LANGUAGE_CONFIGS[language];

  if (!config) {
    onError(`Language "${language}" is not supported`);
    return;
  }

  const execId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpDir = path.join(os.tmpdir(), execId);

  let container;
  let executionEnded = false;

  const finish = (type, msg) => {
    if (executionEnded) return;
    executionEnded = true;
    if (type === "end") onEnd();
    if (type === "error") onError(msg);
    cleanup(tmpDir);
  };

  try {
    await fs.promises.mkdir(tmpDir, { recursive: true });
    await fs.promises.writeFile(path.join(tmpDir, config.filename), code);

    logger.info({ event: "code_execution_start", language, execId });

    const dockerPath = tmpDir.replace(/\\/g, "/");

    container = await docker.createContainer({
      Image: config.image,
      Cmd: config.runCmd,
      HostConfig: {
        Binds: [`${dockerPath}:/code`], // read-write mount for compiled output
        Memory: 128 * 1024 * 1024, // 128MB RAM limit
        CpuPeriod: 100000,
        CpuQuota: 50000, // 50% CPU limit
        NetworkMode: "none", // no internet
        ReadonlyRootfs: true, // can't write to filesystem
        Tmpfs: { "/tmp": "size=64m" }, // writable temp space
        PidsLimit: 64, // max 64 processes
      },
      WorkingDir: "/code",
      AttachStdout: true,
      AttachStderr: true,
    });

    const killTimeout = setTimeout(async () => {
      try {
        await container.stop({ t: 0 });
      } catch {}
      onChunk("\n⏱️ Execution timed out (15s limit)\n");
      finish("end");
      logger.info({ event: "execution_timeout", execId });
    }, 15000);

    try {
      await container.start();
    } catch (err) {
      clearTimeout(killTimeout);
      await safeRemove(container);
      throw err;
    }

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });

    const passthrough = new PassThrough();
    docker.modem.demuxStream(stream, passthrough, passthrough);

    passthrough.on("data", (chunk) => {
      onChunk(chunk.toString("utf8"));
    });

    passthrough.on("error", (err) => {
      console.error("Stream error:", err.message);
    });

    container
      .wait()
      .then(async ({ StatusCode }) => {
        clearTimeout(killTimeout);

        await new Promise((r) => setTimeout(r, 200));

        await safeRemove(container);
        finish("end");

        logger.info({
          event: "code_execution_complete",
          execId,
          StatusCode,
        });
      })
      .catch(async (err) => {
        clearTimeout(killTimeout);
        await safeRemove(container);
        finish("error", err.message || "Container error");
      });
  } catch (error) {
    cleanup(tmpDir);
    logger.error({ event: "execution_error", error: error.message, execId });

    if (error.message.includes("No such image")) {
      onError(`Docker image not found. Run: docker pull ${config.image}`);
    } else if (
      error.message.includes("Cannot connect") ||
      error.message.includes("ENOENT")
    ) {
      onError("Docker is not running. Please start Docker Desktop.");
    } else {
      onError(`Execution failed: ${error.message}`);
    }
  }
};

const safeRemove = async (container) => {
  try {
    await container.remove({ force: true });
  } catch {}
};

const cleanup = (tmpDir) => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
};
