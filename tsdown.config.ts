import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: "**",
  },
  dts: false,
  entry: ["./src/index.ts"],
  format: "esm",
  minify: true,
  nodeProtocol: true,
  outDir: "./dist",
  sourcemap: false,
  treeshake: true,
});
