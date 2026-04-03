import assert from "node:assert/strict";

const descriptorModule = await import("emdash-seo-core");
const sandboxModule = await import("emdash-seo-core/sandbox");

assert.equal(typeof descriptorModule.default, "function");
assert.equal(typeof descriptorModule.seoCore, "function");

const descriptor = descriptorModule.default();
assert.equal(descriptor.id, "seo-core");
assert.equal(descriptor.entrypoint, "emdash-seo-core/sandbox");

assert.equal(typeof sandboxModule.default, "object");
assert.ok(sandboxModule.default);
assert.equal(sandboxModule.default.hooks?.["page:metadata"]?.priority, 500);
assert.ok(sandboxModule.default.routes?.admin);

console.log("Verified package exports: ., ./sandbox");
