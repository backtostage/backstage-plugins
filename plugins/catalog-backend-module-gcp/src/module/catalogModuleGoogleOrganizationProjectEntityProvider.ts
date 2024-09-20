import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { GoogleOrganizationProjectEntityProvider } from '../providers/GoogleOrganizationProjectEntityProvider';

export const catalogModuleGoogleOrganizationProjectEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'google-org-project-entity-provider',
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
          GoogleOrganizationProjectEntityProvider.fromConfig({
            config,
            logger,
            scheduler
          })
        );
      },
    });
  },
});