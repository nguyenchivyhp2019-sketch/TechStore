import { getProducts, getCategories } from "@/lib/products";
import { SITE } from "@/lib/site";

export default async function sitemap() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const now = new Date();

  return [
    { url: SITE.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/track`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((c) => ({
      url: `${SITE.url}/products?category=${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE.url}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
