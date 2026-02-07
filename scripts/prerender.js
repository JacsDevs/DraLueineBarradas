import path from "node:path";
import Prerenderer from "@prerenderer/prerenderer";
import PuppeteerRenderer from "@prerenderer/renderer-puppeteer";
import { fetchPosts } from "./firestore.js";

async function prerender() {
  const posts = await fetchPosts();
  const routes = ["/", ...posts.map((post) => `/post/${post.id}`)];
  const staticDir = path.resolve("dist");

  const prerenderer = new Prerenderer({
    staticDir,
    outputDir: staticDir,
    renderer: new PuppeteerRenderer({
      renderAfterDocumentEvent: "prerender-ready",
      headless: "new"
    })
  });

  await prerenderer.initialize();
  await prerenderer.renderRoutes(routes);
  await prerenderer.destroy();
  console.log(`Prerendered ${routes.length} routes.`);
}

prerender().catch((error) => {
  console.error("Failed to prerender routes:", error);
  process.exitCode = 1;
});
