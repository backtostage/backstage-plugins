---
'@backtostage/plugin-catalog-backend-module-gcp': patch
---

add namespaceByProject option to resources. You can use that to avoid clash in the default namespace

> [!IMPORTANT]
> We don't remove Resources from the `default` namespace when `namespaceByProject` is enabled. So you need to clean that to avoid duplications
