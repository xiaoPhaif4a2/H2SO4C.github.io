import { createHash } from "node:crypto";

/** Derived from the permanent path, so edits and new posts never change a link. */
export function getShortPostId(legacyPath: string): string {
  return createHash("sha256")
    .update(legacyPath.replace(/^\/+|\/+$/g, ""))
    .digest("hex")
    .slice(0, 10);
}
