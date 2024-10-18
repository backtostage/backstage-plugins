import {
  coreServices,
  createBackendModule,
  createExtensionPoint,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { GoogleSQLDatabaseEntityProvider } from '../providers/GoogleSQLDatabaseEntityProvider'
import { GoogleDatabaseResourceTransformer } from '../transformers/defaultResourceTransformer';


export interface GoogleSQLDatabaseEntityProviderTransformsExtensionPoint {
  setResourceTransformer(transformer: GoogleDatabaseResourceTransformer): void 
}

export const googleSQLDatabaseEntityProviderTransformsExtensionPoint =
  createExtensionPoint<GoogleSQLDatabaseEntityProviderTransformsExtensionPoint>({
    id: 'catalog.githubOrgEntityProvider',
  });

export const catalogModuleGoogleSQLDatabaseEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'google-sql-database-entity-provider',
  register(env) {
    let resourceTransformer: GoogleDatabaseResourceTransformer | undefined;


    env.registerExtensionPoint(
      googleSQLDatabaseEntityProviderTransformsExtensionPoint,
      {
        setResourceTransformer(transformer) {
          if (resourceTransformer) {
            throw new Error('Google database resource transformer may only be set once');
          }
          resourceTransformer = transformer;
        },
      },
    );


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
            resourceTransformer,
            logger,
            scheduler
          })
        );
      },
    });
  },
});