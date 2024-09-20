import { Config } from "@backstage/config";
import {
    defaultDatabaseResourceTransformer,
    GoogleDatabaseResourceTransformer
} from "../transformers/defaultResourceTransformer";
import {
    readTaskScheduleDefinitionFromConfig,
    TaskScheduleDefinition,
} from '@backstage/backend-tasks';

export type GoogleSQLDatabaseEntityProviderConfig = {
    project: string
    ownerLabel: string
    componentLabel: string
    resourceType: string
    resourceTransformer: GoogleDatabaseResourceTransformer
    schedule: TaskScheduleDefinition;
    disabled: boolean;
}

export function readProviderConfigs(options: {
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
}): GoogleSQLDatabaseEntityProviderConfig[] {

    const providersConfig = options.config.getOptionalConfigArray('catalog.providers.gcp');
    if (!providersConfig) {
        return [];
    }

    return providersConfig
    .map(config => readProviderConfig(config, options.resourceTransformer))
    .filter(provider => !provider.disabled);
}

export function readProviderConfig(
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
): GoogleSQLDatabaseEntityProviderConfig {
    const project = config.getString("project");
    const ownerLabel = config.getOptionalString('ownerLabel') ?? 'owner'
    const componentLabel = config.getOptionalString('componentLabel') ?? 'component'
    const resourceType = config.getOptionalString('cloudsql.resourceType') ?? 'CloudSQL'
    const disabled = config.getOptionalBoolean('cloudsql.disabled') || false;

    const schedule = readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'));

    return {
        project,
        ownerLabel,
        componentLabel,
        resourceType,
        resourceTransformer: resourceTransformer ?? defaultDatabaseResourceTransformer,
        schedule,
        disabled
    }
}
