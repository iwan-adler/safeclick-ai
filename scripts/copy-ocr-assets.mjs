/**
 * Copies the files tesseract.js needs into public/ocr so screenshot reading
 * is served by SafeClick itself. Without this, tesseract.js would download
 * its engine and language data from a third-party CDN.
 *
 * Runs automatically before `npm run dev` and `npm run build`.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));
const out = join(process.cwd(), "public", "ocr");

const files = [
  [join(pkgDir("tesseract.js"), "dist", "worker.min.js"), join(out, "worker.min.js")],
  // LSTM-only engine builds (plain, SIMD, relaxed SIMD); tesseract.js picks one per device.
  ...["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"].map(
    (f) => [join(pkgDir("tesseract.js-core"), f), join(out, "core", f)],
  ),
  [join(pkgDir("@tesseract.js-data/eng"), "4.0.0_best_int", "eng.traineddata.gz"), join(out, "lang", "eng.traineddata.gz")],
];

for (const [from, to] of files) {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
console.log(`Copied ${files.length} OCR assets to public/ocr`);
