import { SITE } from "@/lib/site";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/cart", "/checkout", "/profile", "/reset-password"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
