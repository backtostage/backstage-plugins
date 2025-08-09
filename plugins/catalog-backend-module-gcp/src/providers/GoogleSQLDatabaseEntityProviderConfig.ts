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
    systemLabel: string
    resourceType: string
    suffix: string
    namespaceByProject: boolean
    resourceTransformer: GoogleDatabaseResourceTransformer
    schedule: TaskScheduleDefinition;
    disabled: boolean;
}


export function readProviderConfigs(options: {
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
}): GoogleSQLDatabaseEntityProviderConfig[] {

    // Try the new config key first for backward compatibility
    let providersConfig = options.config.getOptionalConfigArray('catalog.providers.gcpResources');
    
    // Fall back to the old config key if the new one is not found
    if (!providersConfig) {
        providersConfig = options.config.getOptionalConfigArray('catalog.providers.gcp');
    }
    
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
    const systemLabel = config.getOptionalString('systemLabel') ?? 'system'
    const resourceType = config.getOptionalString('cloudsql.resourceType') ?? 'CloudSQL'
    const suffix = config.getOptionalString('cloudsql.suffix') ?? 'cloudsql'
    const disabled = config.getOptionalBoolean('cloudsql.disabled') || false;
    const namespaceByProject = config.getOptionalBoolean('cloudsql.namespaceByProject') || false;

    const schedule = readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'));

    return {
        id,
        projectLocator: getProjectLocator(config),
        ownerLabel,
        componentLabel,
        systemLabel,
        resourceType,
        suffix,
        resourceTransformer: resourceTransformer ?? defaultDatabaseResourceTransformer,
        schedule,
        disabled,
        namespaceByProject
    }
}
