import { Config } from "@backstage/config";
import {
    defaultDatabaseResourceTransformer,
    GoogleDatabaseResourceTransformer
} from "../transformers/defaultResourceTransformer";
import {
    readTaskScheduleDefinitionFromConfig,
    TaskScheduleDefinition,
} from '@backstage/backend-tasks';
import { getProjectLocator, GoogleProjectLocator } from "../project-locator";

export type GoogleSQLDatabaseEntityProviderConfig = {
    id: string
    projectLocator: GoogleProjectLocator
    ownerLabel: string
    componentLabel: string
    resourceType: string
    suffix: string
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
    // when project is not defined, default to 'organization'
    const id = config.getOptionalString("project") ?? 'organization';
    const ownerLabel = config.getOptionalString('ownerLabel') ?? 'owner'
    const componentLabel = config.getOptionalString('componentLabel') ?? 'component'
    const resourceType = config.getOptionalString('cloudsql.resourceType') ?? 'CloudSQL'
    const suffix = config.getOptionalString('cloudsql.suffix') ?? 'cloudsql'
    const disabled = config.getOptionalBoolean('cloudsql.disabled') || false;

    const schedule = readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'));

    return {
        id,
        projectLocator: getProjectLocator(config),
        ownerLabel,
        componentLabel,
        resourceType,
        suffix,
        resourceTransformer: resourceTransformer ?? defaultDatabaseResourceTransformer,
        schedule,
        disabled
    }
}

