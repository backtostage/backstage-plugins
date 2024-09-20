# Catalog Backend Module for GCP

This is an extension module to the plugin-catalog-backend plugin, providing extensions targeted at GCP.

## Getting started

You will have to add the provider in the catalog initialization code of your
backend. They are not installed by default, therefore you have to add a
dependency on `@backtostage/plugin-catalog-backend-module-gcp` to your backend
package.

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @backtostage/plugin-catalog-backend-module-gcp
```

### Cloud SQL - GoogleSQLDatabaseEntityProvider

To your new backend file, add:

```ts title="packages/backend/src/index.ts"
import { catalogModuleGoogleSQLDatabaseEntityProvider } from '@backtostage/plugin-catalog-backend-module-gcp';


backend.add(
  catalogModuleGoogleSQLDatabaseEntityProvider,
);
```

### Memorystore Redis - GoogleRedisDatabaseEntityProvider

To your new backend file, add:

```ts title="packages/backend/src/index.ts"
import { catalogModuleGoogleRedisDatabaseEntityProvider } from '@backtostage/plugin-catalog-backend-module-gcp';


backend.add(
  catalogModuleGoogleRedisDatabaseEntityProvider,
);
```

### Project - GoogleOrganizationProjectEntityProvider

To your new backend file, add:

```ts title="packages/backend/src/index.ts"
import { catalogModuleGoogleOrganizationProjectEntityProvider } from '@backtostage/plugin-catalog-backend-module-gcp';


backend.add(
  catalogModuleGoogleOrganizationProjectEntityProvider,
);
```

## Configuration

To use this provider, you'll need a [Google Service Account](https://cloud.google.com/iam/docs/service-account-overview).
Once generated, store the path to this file in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.


You can find more details about this in the [official docs](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest#impersonated-credentials-client)

Then you can add a `gcp` config to the catalog providers configuration:

```yaml
catalog:
  providers:
    gcp:
      # the project id need to be the GCP Project where your Resources are present
      - project: my-gcp-project-id
        ownerLabel: team # string
        componentLabel: app # string
        cloudsql:
          resourceType: SQL  # string
          disabled: true # boolean
        redis:
          resourceType: Redis  # string
          location: us-central1 # string
          disabled: true # boolean
        schedule: # same options as in TaskScheduleDefinition
          # supports cron, ISO duration, "human duration" as used in code
          frequency: { minutes: 30 }
          # supports ISO duration, "human duration" as used in code
          timeout: { minutes: 3 }
      # you can configure a organization too. If the project is provided, this config will be skipped
      - organization:
          query: "parent:organizations/XPTO"
          resourceType: Project
        schedule: # same options as in TaskScheduleDefinition
          # supports cron, ISO duration, "human duration" as used in code
          frequency: { minutes: 30 }
          # supports ISO duration, "human duration" as used in code
          timeout: { minutes: 3 }
```

This provider supports multiple projects using different configurations.

- **`project`** _(required when not using organization import)_:
  Project ID of the project for which to list Cloud SQL instances.
- **`organization`** _(optional)_:
    - **`query`** _(optional)_:
      - Default: `` Query param to [Google API](https://cloud.google.com/resource-manager/reference/rest/v3/projects/search#query-parameters)
      - You can narrow the search based in your needs. When not provided a empty value is used. Please follow the API format to configure this param

    - **`resourceType`** _(optional)_:
      - Default: `GCP Project`.
      - The provider will set the [`type`](https://backstage.io/docs/features/software-catalog/descriptor-format#spectype-required-4) based in this information.

    - **`disabled`** _(optional)_:
      - Default: `false`.
      - The entity provider will skip this configuration when disabled.

- **`ownerLabel`** _(optional)_:
  - Default: `owner`.
  - The provider will look for user defined labels to find the [Resource Owner](https://backstage.io/docs/features/software-catalog/descriptor-format#specowner-required-2).
  - You can provide the label name where the owner name is present, if the label isn't present the owner will be set `unknown`.
- **`componentLabel`** _(optional)_:
  - Default: `component`.
  - The provider will look for user defined labels to find the Resource [dependencyOf](https://backstage.io/docs/features/software-catalog/well-known-relations#dependson-and-dependencyof).
  - You can provide the label name where the component name is present, if the label isn't present `dependencyOf` will be skipped.
- **`cloudsql`** _(optional)_:
    - **`resourceType`** _(optional)_:
      - Default: `CloudSQL`.
      - The provider will set the [`type`](https://backstage.io/docs/features/software-catalog/descriptor-format#spectype-required-4) based in this information.
    - **`disabled`** _(optional)_:
      - Default: `false`.
      - The entity provider will skip this configuration when disabled.

- **`redis`** _(optional)_:
    - **`resourceType`** _(optional)_:
      - Default: `Memorystore Redis`.
      - The provider will set the [`type`](https://backstage.io/docs/features/software-catalog/descriptor-format#spectype-required-4) based in this information.
    - **`location`** _(optional)_:
      - Default: `` Wildcard value to [Google API](https://cloud.google.com/memorystore/docs/redis/reference/rest/v1beta1/projects.locations.instances/list)
      - You can narrow the location to list. When not provided instances from all locations will be listed
    - **`disabled`** _(optional)_:
      - Default: `false`.
      - The entity provider will skip this configuration when disabled.

- **`schedule`** _(required)_:
    - **`frequency`**:
      How often you want the task to run. The system does its best to avoid overlapping invocations.
    - **`timeout`**:
      The maximum amount of time that a single task invocation can take.
    - **`initialDelay`** _(optional)_:
      The amount of time that should pass before the first invocation happens.
    - **`scope`** _(optional)_:
      `'global'` or `'local'`. Sets the scope of concurrency control.