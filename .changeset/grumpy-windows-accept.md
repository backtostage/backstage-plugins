---
'@backtostage/plugin-catalog-backend-module-gcp': minor
---

Update plugin to use the new [backend system](https://backstage.io/docs/backend-system/)

## Breaking changes
We updated the GoogleSQLDatabaseEntityProvider to only accept schedule config in catalog config. If you are using the schedule in your code, please move that for the `app-config` file