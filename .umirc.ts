import routes from "./src/routes";
import { defineConfig } from "umi";

export default defineConfig({
  routes,
  npmClient: 'pnpm',
});
