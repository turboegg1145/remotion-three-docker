import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";

const root = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

const getArg = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) {
    return fallback;
  }
  return argv[index + 1] ?? fallback;
};

const isStill = argv.includes("--still");
const compositionId = getArg("composition", "Hero");
const stillFrame = Number(getArg("frame", "96"));
const gl = process.env.REMOTION_GL ?? getArg("gl", "swangle");
const concurrency = Number(
  process.env.REMOTION_CONCURRENCY ?? getArg("concurrency", "2"),
);
const output = path.resolve(
  root,
  getArg("out", isStill ? "out/hero-still.png" : "out/remotion-three-hero.mp4"),
);

fs.mkdirSync(path.dirname(output), { recursive: true });

console.log(`[render] composition : ${compositionId}`);
console.log(`[render] output      : ${output}`);
console.log(`[render] gl          : ${gl}`);
console.log(`[render] concurrency : ${concurrency}`);

const bundleStart = Date.now();
const serveUrl = await bundle({
  entryPoint: path.resolve(root, "src/index.ts"),
  publicDir: path.resolve(root, "public"),
  onProgress: (progress) => {
    if (progress % 25 === 0) {
      process.stdout.write(`\r[render] bundling ${progress}%   `);
    }
  },
});
process.stdout.write("\r");
console.log(`[render] bundled in ${((Date.now() - bundleStart) / 1000).toFixed(1)}s`);

const composition = await selectComposition({
  serveUrl,
  id: compositionId,
  inputProps: {},
});

const chromiumOptions = {
  gl,
  enableMultiProcessOnLinux: true,
};

if (isStill) {
  await renderStill({
    composition,
    serveUrl,
    output,
    frame: stillFrame,
    imageFormat: "png",
    chromiumOptions,
  });
  console.log(`[render] still written (frame ${stillFrame})`);
} else {
  const started = Date.now();
  let lastLog = 0;

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: output,
    inputProps: {},
    concurrency,
    chromiumOptions,
    timeoutInMilliseconds: 120000,
    onProgress: ({ progress, renderedFrames, encodedFrames }) => {
      const now = Date.now();
      if (now - lastLog > 2000 || progress === 1) {
        lastLog = now;
        const pct = Math.round(progress * 100);
        const elapsed = (now - started) / 1000;
        process.stdout.write(
          `\r[render] ${pct}% · frames ${renderedFrames}/${composition.durationInFrames} · encoded ${encodedFrames} · ${elapsed.toFixed(0)}s   `,
        );
      }
    },
  });
  process.stdout.write("\r");
  const seconds = (Date.now() - started) / 1000;
  const size = fs.statSync(output).size;
  console.log(
    `[render] done in ${seconds.toFixed(1)}s · ${(size / 1024 / 1024).toFixed(2)} MB`,
  );
}

console.log(`[render] ${output}`);
