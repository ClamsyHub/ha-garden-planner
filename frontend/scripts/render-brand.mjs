// Original project artwork; MIT. No fonts, external assets or HA branding.
import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
const source = new URL("../../docs/brand/icon.svg", import.meta.url);
const output = new URL(
  "../../custom_components/garden_planner/brand/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const svg = await readFile(source, "utf8");
const browser = await chromium.launch();
try {
  for (const scale of [1, 2]) {
    const page = await browser.newPage({
      viewport: { width: 256, height: 256 },
      deviceScaleFactor: scale,
    });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}img{display:block;width:256px;height:256px}</style><img alt="Garden Planner" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}">`,
    );
    await page.locator("img").evaluate((image) => image.decode());
    await page.screenshot({
      path: new URL(scale === 1 ? "icon.png" : "icon@2x.png", output).pathname,
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
