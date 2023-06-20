import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { GoogleSQLDatabaseEntityProvider } from '@backtostage/plugin-catalog-backend-module-gcp'
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());
  builder.addEntityProvider(GoogleSQLDatabaseEntityProvider.fromConfig({
    config: env.config,
    logger: env.logger,
    scheduler: env.scheduler
  }))
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
