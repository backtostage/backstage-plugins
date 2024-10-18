import { GoogleSQLDatabaseEntityProviderConfig } from "../providers/GoogleSQLDatabaseEntityProviderConfig";
import  {GoogleRedisDatabaseEntityProviderConfig} from "../providers/GoogleRedisDatabaseEntityProviderConfig";
import { sqladmin_v1beta4, redis_v1beta1 } from "googleapis";
import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, ResourceEntity } from "@backstage/catalog-model";
import { GoogleOrganizationProjectEntityProviderConfig } from "../providers/GoogleOrganizationProjectEntityProviderConfig";
import { google } from '@google-cloud/resource-manager/build/protos/protos';

export const ANNOTATION_DATABASE_VERSION = "backtostage.app/google-sql-database-version"
export const ANNOTATION_DATABASE_INSTALLED_VERSION = "backtostage.app/google-sql-database-installed-version"
export const ANNOTATION_GCP_PROJECT = "backtostage.app/google-project"

export const ANNOTATION_REDIS_VERSION = "backtostage.app/google-redis-database-version"

const REDIS_NAME_PARSE =/projects\/(?<project>.*)\/locations\/(?<location>.*)\/instances\/(?<name>.*)/
const PROJECT_NAME_PARSE =/projects(?<project>.*)\/(?<name>.*)/

export type GoogleDatabaseResourceTransformer = (providerConfig: GoogleSQLDatabaseEntityProviderConfig, database: sqladmin_v1beta4.Schema$DatabaseInstance) => ResourceEntity
export const defaultDatabaseResourceTransformer: GoogleDatabaseResourceTransformer = (providerConfig: GoogleSQLDatabaseEntityProviderConfig, database: sqladmin_v1beta4.Schema$DatabaseInstance): ResourceEntity => {
    const annotations: { [name: string]: string } = {
        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${providerConfig.id}`,
        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${providerConfig.id}`,
    };

    if (database.project) annotations[ANNOTATION_GCP_PROJECT] = database.project
    if (database.databaseInstalledVersion) annotations[ANNOTATION_DATABASE_INSTALLED_VERSION] = database.databaseInstalledVersion
    if (database.databaseVersion) annotations[ANNOTATION_DATABASE_VERSION] = database.databaseVersion

    const links = []

    if (database.name && database.project) links.push({
        url: `https://console.cloud.google.com/sql/instances/${database.name}/overview?project=${database.project}`,
        title: "Database URL"
    })

    const owner = database.settings?.userLabels?.[providerConfig.ownerLabel]
    const component = database.settings?.userLabels?.[providerConfig.componentLabel];

    const resource: ResourceEntity = {
        kind: 'Resource',
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
            annotations,
            name: `${database.name!}-${providerConfig.suffix}`,
            title: `${database.name!}-${providerConfig.suffix}`,
            links,
        },
        spec: {
            owner: owner || 'unknown',
            type: providerConfig.resourceType,
        }
    };

    if(providerConfig.namespaceByProject && database.project) {
        resource.metadata.namespace = database.project.toLocaleLowerCase('en-US');
    }

    if (component) {
        resource.spec.dependencyOf = [
            `component:${component}`
        ]
    }


    return resource
}

export type GoogleRedisResourceTransformer = (providerConfig: GoogleRedisDatabaseEntityProviderConfig, redis: redis_v1beta1.Schema$Instance) => ResourceEntity
export const defaultRedisResourceTransformer: GoogleRedisResourceTransformer = (providerConfig: GoogleRedisDatabaseEntityProviderConfig, redis: redis_v1beta1.Schema$Instance): ResourceEntity => {
    const annotations: { [name: string]: string } = {
        [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:${providerConfig.id}`,
        [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:${providerConfig.id}`,
    };
    
    const redisNameGroup = REDIS_NAME_PARSE.exec(redis.name?? "")?.groups
    if(!redisNameGroup) {
        // we assume a strong error if something goes wrong in this step
        throw new Error("Parsing Redis instance resulted in error")
    }
    

    annotations[ANNOTATION_GCP_PROJECT] = redisNameGroup.project
    if (redis.redisVersion) annotations[ANNOTATION_REDIS_VERSION] = redis.redisVersion
    
    const links = []

    if (redisNameGroup.name && redisNameGroup.project) links.push({
        url: `https://console.cloud.google.com/memorystore/redis/locations/${redisNameGroup.location}/instances/${redisNameGroup.name}/details/overview?project=${redisNameGroup.project}`,
        title: "Redis URL"
    })

    const owner = redis.labels?.[providerConfig.ownerLabel]
    const component = redis.labels?.[providerConfig.componentLabel];

    const resource: ResourceEntity = {
        kind: 'Resource',
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
            annotations,
            name: `${redisNameGroup.name}-${providerConfig.suffix}`,
            links,
        },
        spec: {
            owner: owner || 'unknown',
            type: providerConfig.resourceType,
        }
    };

    if(providerConfig.namespaceByProject) {
        resource.metadata.namespace = redisNameGroup.project.toLocaleLowerCase('en-US');
    }


    if (component) {
        resource.spec.dependencyOf = [
            `component:${component}`
        ]
    }


    return resource
}

export type GoogleOrganizationProjectResourceTransformer = (providerConfig: GoogleOrganizationProjectEntityProviderConfig, project: google.cloud.resourcemanager.v3.IProject) => ResourceEntity
export const defaultOrganizationProjectResourceTransformer: GoogleOrganizationProjectResourceTransformer = (providerConfig: GoogleOrganizationProjectEntityProviderConfig, project: google.cloud.resourcemanager.v3.IProject): ResourceEntity => {
    const annotations: { [name: string]: string } = {
        [ANNOTATION_LOCATION]: `google-org-project-entity-provider:${providerConfig.position}`,
        [ANNOTATION_ORIGIN_LOCATION]: `google-org-project-entity-provider:${providerConfig.position
        }`,
    };

    const projectNameGroup = PROJECT_NAME_PARSE.exec(project.name?? "")?.groups
    const labels: Record<string, string> = {}
    if(project.labels){
        Object.keys(project.labels).forEach((value) => {
            labels[value] = project.labels?.[value] || "";
          });
    }
    if(!projectNameGroup) {
        // we assume a strong error if something goes wrong in this step
        throw new Error("Parsing Project name resulted in error")
    }
    

    annotations[ANNOTATION_GCP_PROJECT] = project.projectId || projectNameGroup.name
    
    const links = []

    if (projectNameGroup.name) links.push({
        url: `https://console.cloud.google.com/?project=${project.projectId || projectNameGroup.name}`,
        title: "Project URL"
    })

    const owner = project.labels?.[providerConfig.ownerLabel]
    const component = project.labels?.[providerConfig.componentLabel];

    const resource: ResourceEntity = {
        kind: 'Resource',
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
            annotations,
            name: project.projectId || projectNameGroup.name,
            description: project.displayName || projectNameGroup.name,
            links,
            labels,
        },
        spec: {
            owner: owner || 'unknown',
            type: providerConfig.resourceType,
        }
    };

    if (component) {
        resource.spec.dependencyOf = [
            `component:${component}`
        ]
    }


    return resource
}