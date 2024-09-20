import { Config } from "@backstage/config";
import {
    defaultOrganizationProjectResourceTransformer,
    GoogleOrganizationProjectResourceTransformer,
} from "../transformers/defaultResourceTransformer";
import {
    readTaskScheduleDefinitionFromConfig,
    TaskScheduleDefinition,
} from '@backstage/backend-tasks';

export type GoogleOrganizationProjectEntityProviderConfig = {
    position: number
    query?: string
    ownerLabel: string
    componentLabel: string
    resourceType: string
    resourceTransformer: GoogleOrganizationProjectResourceTransformer
    schedule: TaskScheduleDefinition;
    disabled: boolean;
}

export function readProviderConfigs(options: {
    config: Config,
    resourceTransformer?: GoogleOrganizationProjectResourceTransformer
}): GoogleOrganizationProjectEntityProviderConfig[] {

    const providersConfig = options.config.getOptionalConfigArray('catalog.providers.gcp');
    if (!providersConfig) {
        return [];
    }

    return providersConfig
    .map((config, index) => readProviderConfig(config, index, options.resourceTransformer))
    .filter(provider => !provider.disabled);
}

export function readProviderConfig(
    config: Config,
    index: number,
    resourceTransformer?: GoogleOrganizationProjectResourceTransformer
): GoogleOrganizationProjectEntityProviderConfig {
    const query = config.getOptionalString("organization.query");
    const ownerLabel = config.getOptionalString('ownerLabel') ?? 'owner'
    const componentLabel = config.getOptionalString('componentLabel') ?? 'component'
    const resourceType = config.getOptionalString('organization.resourceType') ?? 'GCP Project'

    const schedule = readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'));

    let disabled = config.getOptionalBoolean('organization.disabled') || false;
    const project = config.getOptionalString("project");
    // If project is defined, we disable the provider
    if(project) {
        disabled = true;
    }

    return {
        position: index,
        query,
        ownerLabel,
        componentLabel,
        resourceType,
        resourceTransformer: resourceTransformer ?? defaultOrganizationProjectResourceTransformer,
        schedule,
        disabled,
    }
}
