import {GoogleSQLDatabaseEntityProviderConfig} from "../providers/GoogleSQLDatabaseEntityProviderConfig";
import {sqladmin_v1beta4} from "googleapis";
import {ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, ResourceEntity} from "@backstage/catalog-model";

export type GoogleDatabaseResourceTransformer = (providerConfig: GoogleSQLDatabaseEntityProviderConfig, database: sqladmin_v1beta4.Schema$DatabaseInstance) => ResourceEntity
export const defaultDatabaseResourceTransformer: GoogleDatabaseResourceTransformer = (providerConfig: GoogleSQLDatabaseEntityProviderConfig, database: sqladmin_v1beta4.Schema$DatabaseInstance): ResourceEntity => {
    const annotations: { [name: string]: string } = {
        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${providerConfig.project}`,
        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${providerConfig.project}`,
    };

    const owner = database.settings?.userLabels?.[providerConfig.ownerLabel]
    const component = database.settings?.userLabels?.[providerConfig.componentLabel];

    const resource: ResourceEntity = {
        kind: 'Resource',
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
            annotations,
            name: database.name!,
            title: database.name!,
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