import {defaultDatabaseResourceTransformer} from "./defaultResourceTransformer";
import {GoogleSQLDatabaseEntityProviderConfig} from "../providers/GoogleSQLDatabaseEntityProviderConfig";
import {sqladmin_v1beta4} from "googleapis";
import {ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION} from "@backstage/catalog-model";

describe('defaultDatabaseResourceTransformer', () => {
    it('should be defined', () => {
        expect(defaultDatabaseResourceTransformer).toBeDefined()
    })

    describe('when a Database instance is provided', () => {
        const config: GoogleSQLDatabaseEntityProviderConfig = {
            project: 'project',
            componentLabel: 'component',
            ownerLabel: 'owner',
            resourceType: 'SQL',
            resourceTransformer: defaultDatabaseResourceTransformer
        }

        const database: sqladmin_v1beta4.Schema$DatabaseInstance = {
            name: 'database-name',
            settings: {
                userLabels: {
                    [config.ownerLabel]: 'owner',
                    [config.componentLabel]: 'my-service',
                }
            }
        }

        it('should transform in a resource entity', () => {

            const result = defaultDatabaseResourceTransformer(config, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                    },
                    name: 'database-name',
                    title: "database-name",
                },
                spec: {
                    dependencyOf: [
                        'component:my-service'
                    ],
                    owner: 'owner',
                    type: 'SQL'
                }
            })
        })

        it('should use unknown in a resource entity without label owner defined in database label', () => {
            const localConfig: GoogleSQLDatabaseEntityProviderConfig = {
                project: 'project',
                componentLabel: 'component',
                ownerLabel: 'ownerNotPresent',
                resourceType: 'SQL',
                resourceTransformer: defaultDatabaseResourceTransformer
            }

            const result = defaultDatabaseResourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                    },
                    name: 'database-name',
                    title: "database-name",
                },
                spec: {
                    dependencyOf: [
                        'component:my-service'
                    ],
                    owner: 'unknown',
                    type: 'SQL'
                }
            })
        })

        it('should use empty dependencies in a resource entity without label component defined in database label', () => {
            const localConfig: GoogleSQLDatabaseEntityProviderConfig = {
                project: 'project',
                componentLabel: 'componentNotPresent',
                ownerLabel: 'owner',
                resourceType: 'SQL',
                resourceTransformer: defaultDatabaseResourceTransformer
            }

            const result = defaultDatabaseResourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                    },
                    name: 'database-name',
                    title: "database-name",
                },
                spec: {
                    owner: 'owner',
                    type: 'SQL'
                }
            })
        })

        it('should use empty values in a resource entity without user settings defined in database', () => {
            const localDatabase: sqladmin_v1beta4.Schema$DatabaseInstance = {
                name: 'database-name',
            }

            const result = defaultDatabaseResourceTransformer(config, localDatabase);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `GoogleSQLDatabaseEntityProvider:${config.project}`,
                    },
                    name: 'database-name',
                    title: "database-name",
                },
                spec: {
                    owner: 'unknown',
                    type: 'SQL'
                }
            })
        })
    })
})