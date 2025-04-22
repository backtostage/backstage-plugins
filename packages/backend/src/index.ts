import { createBackend } from '@backstage/backend-defaults';
import { authModuleGithubProvider } from './plugins/auth'
import {
  catalogModuleGoogleSQLDatabaseEntityProvider,
  catalogModuleGoogleRedisDatabaseEntityProvider
} from '@backtostage/plugin-catalog-backend-module-gcp';

const backend = createBackend();
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-techdocs-backend'));
// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
// backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
backend.add(authModuleGithubProvider)

// See https://backstage.io/docs/auth/guest/provider
// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(catalogModuleGoogleSQLDatabaseEntityProvider)
backend.add(catalogModuleGoogleRedisDatabaseEntityProvider)


// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);
// search plugin
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));
backend.start();
