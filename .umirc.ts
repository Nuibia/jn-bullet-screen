import routes from "./config/routes";
import { defineConfig } from "umi";

export default defineConfig({
  routes,
  npmClient: 'pnpm',
});
