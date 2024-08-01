# @backtostage/plugin-catalog-backend-module-gcp

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
