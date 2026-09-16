import { verifyOpenApiManifest } from "../src/openapi-integrity.js";

const counts = await verifyOpenApiManifest(process.cwd());
console.error(`Verified OpenAPI manifest hashes: Cloud ${counts.cloud}, Unified ${counts.unified}`);
