import { z } from "zod";
import type { GeneratedOperation } from "./generated/operations.js";

const removedFields: Record<string, string[][]> = {
  hetzner_cloud_list_images: [["images"]],
  hetzner_cloud_get_image: [["image"]],
  hetzner_cloud_update_image: [["image"]],
  hetzner_cloud_create_server_image: [["image"]],
  hetzner_cloud_list_server_types: [["server_types"]],
  hetzner_cloud_get_server_type: [["server_type"]],
  hetzner_cloud_list_load_balancer_types: [["load_balancer_types"]],
  hetzner_cloud_get_load_balancer_type: [["load_balancer_type"]],
  hetzner_cloud_list_load_balancers: [["load_balancers", "load_balancer_type"]],
  hetzner_cloud_create_load_balancer: [["load_balancer", "load_balancer_type"]],
  hetzner_cloud_get_load_balancer: [["load_balancer", "load_balancer_type"]],
  hetzner_cloud_update_load_balancer: [["load_balancer", "load_balancer_type"]],
  hetzner_cloud_list_servers: [["servers", "server_type"], ["servers", "image"]],
  hetzner_cloud_get_server: [["server", "server_type"], ["server", "image"]],
  hetzner_cloud_update_server: [["server", "server_type"], ["server", "image"]],
  hetzner_cloud_create_server: [["server", "server_type"], ["server", "image"]],
};

function omitDeprecated(schema: z.ZodType, path: string[]): z.ZodType {
  if (schema instanceof z.ZodOptional) return schema.clone({ ...schema.def, innerType: omitDeprecated(schema.unwrap() as z.ZodType, path) }).meta(schema.meta() ?? {});
  if (schema instanceof z.ZodArray) return schema.clone({ ...schema.def, element: omitDeprecated(schema.element as z.ZodType, path) }).meta(schema.meta() ?? {});
  if (schema instanceof z.ZodUnion) return schema.clone({ ...schema.def, options: schema.options.map((option) => option instanceof z.ZodNull ? option : omitDeprecated(option as z.ZodType, path)) }).meta(schema.meta() ?? {});
  if (!(schema instanceof z.ZodObject)) throw new Error(`Unexpected response schema at ${path.join(".")}`);
  const [key, ...rest] = path;
  if (key === undefined) return schema.omit({ deprecated: true }).meta(schema.meta() ?? {});
  const child = schema.shape[key] as z.ZodType | undefined;
  if (!child) throw new Error(`Missing response schema property: ${key}`);
  return schema.extend({ [key]: omitDeprecated(child, rest) }).meta(schema.meta() ?? {});
}

export function currentResponseSchema(operation: GeneratedOperation): z.ZodType {
  return (removedFields[operation.name] ?? []).reduce(omitDeprecated, operation.responseSchema);
}
