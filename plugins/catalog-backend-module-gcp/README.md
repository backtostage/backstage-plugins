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
And then add the entity provider to your catalog builder:

```ts title="packages/backend/src/plugins/catalog.ts"
import { GoogleSQLDatabaseEntityProvider } from '@backtostage/plugin-catalog-backend-module-gcp'

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addEntityProvider(
      GoogleSQLDatabaseEntityProvider.fromConfig({
      config: env.config,
      logger: env.logger,
      // optional: alternatively, use scheduler with schedule defined in app-config.yaml
      schedule: env.scheduler.createScheduledTaskRunner({
        frequency: { minutes: 30 },
        timeout: { minutes: 3 },
      }),
      // optional: alternatively, use schedule
      scheduler: env.scheduler,
    }),
  );

  // ..
}
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
        schedule: # optional; same options as in TaskScheduleDefinition
          # supports cron, ISO duration, "human duration" as used in code
          frequency: { minutes: 30 }
          # supports ISO duration, "human duration" as used in code
          timeout: { minutes: 3 }
```

This provider supports multiple projects using different configurations.

- **`project`** _(required)_:
  Project ID of the project for which to list Cloud SQL instances.
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
- **`schedule`** _(optional)_:
    - **`frequency`**:
      How often you want the task to run. The system does its best to avoid overlapping invocations.
    - **`timeout`**:
      The maximum amount of time that a single task invocation can take.
    - **`initialDelay`** _(optional)_:
      The amount of time that should pass before the first invocation happens.
    - **`scope`** _(optional)_:
      `'global'` or `'local'`. Sets the scope of concurrency control.