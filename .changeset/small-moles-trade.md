---
'@backtostage/plugin-catalog-backend-module-gcp': patch
---

Add more metadata info to SQL Resource. The metadata now have:

- backtostage.app/google-project - GCP Project
- backtostage.app/google-sql-database-version - The database engine type and version such as `POSTGRES_15`
- backtostage.app/google-sql-database-installed-version -  Stores the current database version running on the instance including minor version such as `POSTGRES_15_7`
