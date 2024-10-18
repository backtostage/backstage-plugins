import {defaultDatabaseResourceTransformer} from "./defaultResourceTransformer";
import {GoogleSQLDatabaseEntityProviderConfig} from "../providers/GoogleSQLDatabaseEntityProviderConfig";
import {sqladmin_v1beta4} from "googleapis";
import {ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION} from "@backstage/catalog-model";
import { GoogleProjectLocatorByConfig } from "../project-locator/GoogleProjectLocatorByConfig";

describe('defaultDatabaseResourceTransformer', () => {
    it('should be defined', () => {
        expect(defaultDatabaseResourceTransformer).toBeDefined()
    })

    describe('when a Database instance is provided', () => {
        const config: GoogleSQLDatabaseEntityProviderConfig = {
            id: 'project',
            projectLocator: new GoogleProjectLocatorByConfig("project"),
            componentLabel: 'component',
            ownerLabel: 'owner',
            resourceType: 'SQL',
            suffix: "sql",
            resourceTransformer: defaultDatabaseResourceTransformer,
            schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
            },
            disabled: true,
            namespaceByProject: false
        }

        const database: sqladmin_v1beta4.Schema$DatabaseInstance = {
            name: 'database-name',
            databaseVersion: "POSTGRES_15",
            databaseInstalledVersion: "POSTGRES_15_7",
            project: "project",
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
                        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": config.id,
                        "backtostage.app/google-sql-database-version": "POSTGRES_15",
                        "backtostage.app/google-sql-database-installed-version": "POSTGRES_15_7",
                    },
                    name: 'database-name-sql',
                    title: "database-name-sql",
                    links: [{
                        url : `https://console.cloud.google.com/sql/instances/database-name/overview?project=${config.id}`,
                        title: "Database URL"
                    }]
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
                id: 'project',
                projectLocator: new GoogleProjectLocatorByConfig("project"),
                componentLabel: 'component',
                ownerLabel: 'ownerNotPresent',
                resourceType: 'SQL',
                suffix: "sql",
                resourceTransformer: defaultDatabaseResourceTransformer,
                schedule: {
                    frequency: { minutes: 30 },
                    timeout: { minutes: 3 },
                },
                disabled: true,
                namespaceByProject: false
            }

            const result = defaultDatabaseResourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": config.id,
                        "backtostage.app/google-sql-database-version": "POSTGRES_15",
                        "backtostage.app/google-sql-database-installed-version": "POSTGRES_15_7",
                    },
                    name: 'database-name-sql',
                    title: "database-name-sql",
                    links: [{
                        url : `https://console.cloud.google.com/sql/instances/database-name/overview?project=${config.id}`,
                        title: "Database URL"
                    }]
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
                id: 'project',
                projectLocator: new GoogleProjectLocatorByConfig("project"),
                componentLabel: 'componentNotPresent',
                ownerLabel: 'owner',
                resourceType: 'SQL',
                suffix: "sql",
                resourceTransformer: defaultDatabaseResourceTransformer,
                schedule: {
                    frequency: { minutes: 30 },
                    timeout: { minutes: 3 },
                },
                disabled: true,
                namespaceByProject: false
            }

            const result = defaultDatabaseResourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": config.id,
                        "backtostage.app/google-sql-database-version": "POSTGRES_15",
                        "backtostage.app/google-sql-database-installed-version": "POSTGRES_15_7",
                    },
                    name: 'database-name-sql',
                    title: "database-name-sql",
                    links: [{
                        url : `https://console.cloud.google.com/sql/instances/database-name/overview?project=${config.id}`,
                        title: "Database URL"
                    }]
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
                        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        
                    },
                    name: 'database-name-sql',
                    title: "database-name-sql",
                    links: [],
                },
                spec: {
                    owner: 'unknown',
                    type: 'SQL'
                }
            })
        })

        it('should set namespace by project', () => {
            const localConfig: GoogleSQLDatabaseEntityProviderConfig = {
                id: 'project',
                projectLocator: new GoogleProjectLocatorByConfig("project"),
                componentLabel: 'component',
                ownerLabel: 'owner',
                resourceType: 'SQL',
                suffix: "sql",
                resourceTransformer: defaultDatabaseResourceTransformer,
                schedule: {
                    frequency: { minutes: 30 },
                    timeout: { minutes: 3 },
                },
                disabled: true,
                namespaceByProject: true
            }

            const result = defaultDatabaseResourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": config.id,
                        "backtostage.app/google-sql-database-version": "POSTGRES_15",
                        "backtostage.app/google-sql-database-installed-version": "POSTGRES_15_7",
                    },
                    namespace: "project",
                    name: 'database-name-sql',
                    title: "database-name-sql",
                    links: [{
                        url : `https://console.cloud.google.com/sql/instances/database-name/overview?project=${config.id}`,
                        title: "Database URL"
                    }]
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
    })
})