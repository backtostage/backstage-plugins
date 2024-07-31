import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { GoogleSQLDatabaseEntityProvider } from '../providers/GoogleSQLDatabaseEntityProvider'

export const catalogModuleGoogleSQLDatabaseEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'google-sql-database-entity-provider',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ config, catalog, logger, scheduler }) {
        catalog.addEntityProvider(
          GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler
          })
        );
      },
    });
  },
});