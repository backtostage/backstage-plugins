---
'@backtostage/plugin-catalog-backend-module-gcp': patch
---

Fix configuration clash with official Backstage GCP module

- Added new configuration key `catalog.providers.gcpResources` to avoid conflicts with the official Backstage `@backstage/plugin-catalog-backend-module-gcp` which uses `catalog.providers.gcp.gke`
- Maintained backward compatibility by still supporting the old `catalog.providers.gcp` key (deprecated)
- Users are encouraged to migrate to `catalog.providers.gcpResources` to avoid conflicts when using both plugins together

This change resolves the issue where both plugins were trying to use the same configuration namespace, causing conflicts when users wanted to use both the official Backstage GCP module (for GKE resources) and this plugin (for Cloud SQL, Redis, and Project resources) simultaneously.