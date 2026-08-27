# Cloudflare cache configuration

The production zone uses the following active Cache Rule so file types that
Cloudflare does not cache by default, including GLB models, still reach the
edge cache.

## Cache static game assets

- Match expression:
  `(http.host eq "paiwawa.site" and starts_with(http.request.uri.path, "/assets/"))`
- Cache eligibility: Eligible for cache
- Edge TTL: Use the origin `Cache-Control` header; bypass when it is absent
- Browser TTL: Respect origin TTL

Smart Tiered Cache is active for the zone. The Nginx configuration remains the
source of truth for TTL values:

- `index.html`: revalidate on every visit
- content-hashed JS, CSS, and fonts: one year, immutable
- stable game assets: one day in browsers and seven days in shared caches
- root metadata and preview images: one hour in browsers and one day in shared caches

Stable asset paths must be purged from Cloudflare when their contents are
replaced in place. Content-hashed bundles do not require purging.
