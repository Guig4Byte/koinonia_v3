import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));

const files = await readdir(publicDir).catch((error) => {
  if (error.code === "ENOENT") {
    return [];
  }

  throw error;
});

const generatedPwaFiles = files.filter(
  (fileName) => fileName === "sw.js" || /^workbox-[\w-]+\.js$/.test(fileName),
);

await Promise.all(
  generatedPwaFiles.map((fileName) => rm(join(publicDir, fileName), { force: true })),
);

if (generatedPwaFiles.length === 0) {
  console.log("Nenhum artefato gerado de PWA encontrado em public/.");
} else {
  console.log(`Artefatos gerados de PWA removidos: ${generatedPwaFiles.join(", ")}`);
}
