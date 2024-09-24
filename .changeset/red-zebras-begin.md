---
'@backtostage/plugin-catalog-backend-module-gcp': patch
---

Catch errors to list resources from gcp.
Now when a list a resource fails for a project, we just skip this project. Avoiding to stop all the process just because some projects raise errors
