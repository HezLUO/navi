import path from "node:path";
import { createApp } from "./app";

const repoPath = process.env.ALONG_REPO_PATH ? path.resolve(process.env.ALONG_REPO_PATH) : process.cwd();
const port = Number(process.env.ALONG_PORT ?? 4317);
const app = createApp({ repoPath });

app.listen(port, "127.0.0.1", () => {
  console.log(`Along is listening at http://127.0.0.1:${port}`);
});
