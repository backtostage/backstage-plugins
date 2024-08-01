import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { GoogleRedisDatabaseEntityProvider } from '../providers/GoogleRedisDatabaseEntityProvider'

export const catalogModuleGoogleRedisDatabaseEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'google-redis-database-entity-provider',
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
          GoogleRedisDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler
          })
        );
      },
    });
  },
});