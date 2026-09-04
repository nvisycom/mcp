import { createRequire } from "node:module";
import { defineConfig } from "tsdown";

const { version } = createRequire(import.meta.url)("./package.json");

export default defineConfig({
	// Inject the package version at build time so it never drifts from
	// package.json (reported to clients during the MCP handshake).
	define: {
		__MCP_VERSION__: JSON.stringify(version),
	},

	// Entry and format configuration
	// `index` is the library entry, `stdio` the executable bin entry.
	entry: ["src/index.ts", "src/stdio.ts"],
	format: ["esm"],

	// Output configuration
	// `"type": "module"` already makes `.js` unambiguously ESM, so keep the
	// plain extension instead of the `.mjs` the node platform would emit.
	outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
	outDir: "dist",
	dts: true,
	sourcemap: true,
	clean: true,

	// Build behavior
	minify: false,
	treeshake: true,

	// Platform and target
	// The server runs on Node (stdio transport, process env), unlike the SDK.
	platform: "node",
	target: "es2022",

	// External dependencies (not bundled)
	deps: {
		neverBundle: ["@modelcontextprotocol/sdk", "@nvisy/sdk", "zod"],
	},
});
