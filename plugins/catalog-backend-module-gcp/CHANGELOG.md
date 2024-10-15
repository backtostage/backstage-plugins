# @backtostage/plugin-catalog-backend-module-gcp

## 0.2.3

### Patch Changes

- [#206](https://github.com/backtostage/backstage-plugins/pull/206) [`ce701276e0868719ab3ac353d67726debe5e2ced`](https://github.com/backtostage/backstage-plugins/commit/ce701276e0868719ab3ac353d67726debe5e2ced) Thanks [@angeliski](https://github.com/angeliski)! - Add a suffix option to import resources and avoid name clash. To avoid errors in the config, default values are provided.

## 0.2.2

### Patch Changes

- [#179](https://github.com/backtostage/backstage-plugins/pull/179) [`c9ee73072d28614ad7ee68d3f7487bfa25d6222b`](https://github.com/backtostage/backstage-plugins/commit/c9ee73072d28614ad7ee68d3f7487bfa25d6222b) Thanks [@angeliski](https://github.com/angeliski)! - Catch errors to list resources from gcp.
  Now when a list a resource fails for a project, we just skip this project. Avoiding to stop all the process just because some projects raise errors

## 0.2.1

### Patch Changes

- [#141](https://github.com/backtostage/backstage-plugins/pull/141) [`9af82d5984043bd291f0a432909381e56585a70b`](https://github.com/backtostage/backstage-plugins/commit/9af82d5984043bd291f0a432909381e56585a70b) Thanks [@angeliski](https://github.com/angeliski)! - This change adds a new entity provider to import redis memorystore from GCP

  We are using a separete module export to allow more flexibility in each resource you want to import in your backstage instance

- [#177](https://github.com/backtostage/backstage-plugins/pull/177) [`cf9442aa03fba28cce6286ef146d3745c64f6774`](https://github.com/backtostage/backstage-plugins/commit/cf9442aa03fba28cce6286ef146d3745c64f6774) Thanks [@angeliski](https://github.com/angeliski)! - Add locator to enable organization load

  You can now use [Google API](https://cloud.google.com/resource-manager/reference/rest/v3/projects/search#query-parameters) to load projects from your organization and that will be used to load GCP Resources.

- [#172](https://github.com/backtostage/backstage-plugins/pull/172) [`041d377bb9b04a1d17f3f81dd1b4dd81321c4c6f`](https://github.com/backtostage/backstage-plugins/commit/041d377bb9b04a1d17f3f81dd1b4dd81321c4c6f) Thanks [@angeliski](https://github.com/angeliski)! - This change adds a new entity provider to import Projects from GCP

  We are using a separete module export to allow more flexibility in each resource you want to import in your backstage instance

- [#172](https://github.com/backtostage/backstage-plugins/pull/172) [`041d377bb9b04a1d17f3f81dd1b4dd81321c4c6f`](https://github.com/backtostage/backstage-plugins/commit/041d377bb9b04a1d17f3f81dd1b4dd81321c4c6f) Thanks [@angeliski](https://github.com/angeliski)! - Add disabled option to entity providers. The default behavior is to try to import all providers from each configuration, now you can disable when needed.

## 0.2.0

### Minor Changes

- [#138](https://github.com/backtostage/backstage-plugins/pull/138) [`70fd387a2aa8fc659ade5c4a89eca2458f11041b`](https://github.com/backtostage/backstage-plugins/commit/70fd387a2aa8fc659ade5c4a89eca2458f11041b) Thanks [@angeliski](https://github.com/angeliski)! - Update plugin to use the new [backend system](https://backstage.io/docs/backend-system/)

  ## Breaking changes

  We updated the GoogleSQLDatabaseEntityProvider to only accept schedule config in catalog config. If you are using the schedule in your code, please move that for the `app-config` file

### Patch Changes

- [#138](https://github.com/backtostage/backstage-plugins/pull/138) [`70fd387a2aa8fc659ade5c4a89eca2458f11041b`](https://github.com/backtostage/backstage-plugins/commit/70fd387a2aa8fc659ade5c4a89eca2458f11041b) Thanks [@angeliski](https://github.com/angeliski)! - Change provider name and ids from `GoogleSqlDatabaseEntityProvider` to `google-sql-database-entity-provider`

  This change is to match backstage patterns used in many entity providers

- [#140](https://github.com/backtostage/backstage-plugins/pull/140) [`f8855fc815d7cbc1e154652150e09492356f9037`](https://github.com/backtostage/backstage-plugins/commit/f8855fc815d7cbc1e154652150e09492356f9037) Thanks [@angeliski](https://github.com/angeliski)! - Add more metadata info to SQL Resource. The metadata now have:

  - backtostage.app/google-project - GCP Project
  - backtostage.app/google-sql-database-version - The database engine type and version such as `POSTGRES_15`
  - backtostage.app/google-sql-database-installed-version - Stores the current database version running on the instance including minor version such as `POSTGRES_15_7`

## 0.1.1

### Patch Changes

- [`afbadcf`](https://github.com/backtostage/backstage-plugins/commit/afbadcf142b7f26bc55a89dd075c007f81cefdbb) Thanks [@angeliski](https://github.com/angeliski)! - export config schema from plugin

- [#75](https://github.com/backtostage/backstage-plugins/pull/75) [`851b12b`](https://github.com/backtostage/backstage-plugins/commit/851b12b8407e8a672911efa381313db2c3d1dff6) Thanks [@angeliski](https://github.com/angeliski)! - change the base schema config

## 0.1.0

### Minor Changes

- Release first version to import Cloud SQL instances
