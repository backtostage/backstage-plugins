import {Config} from "@backstage/config";
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
    schedule?: TaskScheduleDefinition;
}

export function readProviderConfigs(options: {
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
}): GoogleSQLDatabaseEntityProviderConfig[] {

    const providersConfig = options.config.getOptionalConfig('catalog.providers.gcp');
    if (!providersConfig) {
        return [];
    }

    return providersConfig.keys().map(project => {
        const providerConfig = providersConfig.getConfig(project);

        return readProviderConfig(project, providerConfig, options.resourceTransformer);
    });
}

export function readProviderConfig(
    project: string,
    config: Config,
    resourceTransformer?: GoogleDatabaseResourceTransformer
): GoogleSQLDatabaseEntityProviderConfig {
    const ownerLabel = config.getOptionalString('ownerLabel') ?? 'owner'
    const componentLabel = config.getOptionalString('componentLabel') ?? 'component'
    const resourceType = config.getOptionalString('resourceType') ?? 'CloudSQL'

    const schedule = config.has('schedule')
        ? readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'))
        : undefined;


    return {
        project,
        ownerLabel,
        componentLabel,
        resourceType,
        resourceTransformer: resourceTransformer ?? defaultDatabaseResourceTransformer,
        schedule
    }
}
