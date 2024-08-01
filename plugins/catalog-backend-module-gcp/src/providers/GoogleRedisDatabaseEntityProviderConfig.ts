import { Config } from "@backstage/config";
import {
    defaultRedisResourceTransformer,
    GoogleDatabaseResourceTransformer,
    GoogleRedisResourceTransformer
} from "../transformers/defaultResourceTransformer";
import {
    readTaskScheduleDefinitionFromConfig,
    TaskScheduleDefinition,
} from '@backstage/backend-tasks';

export type GoogleRedisDatabaseEntityProviderConfig = {
    project: string
    location?: string
    ownerLabel: string
    componentLabel: string
    resourceType: string
    resourceTransformer: GoogleRedisResourceTransformer
    schedule: TaskScheduleDefinition;
}

export function readProviderConfigs(options: {
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
}): GoogleRedisDatabaseEntityProviderConfig[] {

    const providersConfig = options.config.getOptionalConfigArray('catalog.providers.gcp');
    if (!providersConfig) {
        return [];
    }

    return providersConfig.map(config => readProviderConfig(config, options.resourceTransformer));
}

export function readProviderConfig(
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
): GoogleRedisDatabaseEntityProviderConfig {
    const project = config.getString("project");
    const ownerLabel = config.getOptionalString('ownerLabel') ?? 'owner'
    const componentLabel = config.getOptionalString('componentLabel') ?? 'component'
    const resourceType = config.getOptionalString('redis.resourceType') ?? 'Memorystore Redis'
    const location = config.getOptionalString('redis.location')


    const schedule = readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'));

    return {
        project,
        ownerLabel,
        componentLabel,
        resourceType,
        location,
        resourceTransformer: resourceTransformer ?? defaultRedisResourceTransformer,
        schedule
    }
}
