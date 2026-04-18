/**
 * Slug helper shared between CLI config flows. Normalizes an arbitrary
 * string into a lowercase-kebab URL slug matching the server's validation.
 */
export function slugify(input: string, max = 48): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}
