import {defaultDatabaseResourceTransformer, defaultRedisResourceTransformer} from "./defaultResourceTransformer";
import {GoogleSQLDatabaseEntityProviderConfig} from "../providers/GoogleSQLDatabaseEntityProviderConfig";
import {redis_v1beta1, sqladmin_v1beta4} from "googleapis";
import {ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION} from "@backstage/catalog-model";
import { GoogleProjectLocatorByConfig } from "../project-locator/GoogleProjectLocatorByConfig";
import { GoogleRedisDatabaseEntityProviderConfig } from "../providers/GoogleRedisDatabaseEntityProviderConfig";

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
                    owner: 'default/owner',
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
                    owner: 'default/unknown',
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
                    owner: 'default/owner',
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
                    owner: 'default/unknown',
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
                    owner: 'default/owner',
                    type: 'SQL'
                }
            })
        })
    })

    describe('when a Redis instance is provided', () => {
        const config: GoogleRedisDatabaseEntityProviderConfig = {
            id: 'project',
            projectLocator: new GoogleProjectLocatorByConfig("project"),
            componentLabel: 'component',
            ownerLabel: 'owner',
            resourceType: 'redis',
            suffix: "memorystore",
            resourceTransformer: defaultRedisResourceTransformer,
            schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
            },
            disabled: true,
            namespaceByProject: false
        }

        const database: redis_v1beta1.Schema$Instance = {
            name: 'projects/my-project/locations/us-central1/instances/database-name',
            redisVersion: "REDIS_4",

            labels: {
                [config.ownerLabel]: 'owner',
                [config.componentLabel]: 'my-service',
            }
        }

        it('should transform in a resource entity', () => {

            const result = config.resourceTransformer(config, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": "my-project",
                        "backtostage.app/google-redis-database-version": "REDIS_4",
                    },
                    name: 'database-name-memorystore',
                    links: [{
                        url : `https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/database-name/details/overview?project=my-project`,
                        title: "Redis URL"
                    }]
                },
                spec: {
                    dependencyOf: [
                        'component:my-service'
                    ],
                    owner: 'default/owner',
                    type: 'redis'
                }
            })
        })

        it('should use unknown in a resource entity without label owner defined in database label', () => {
            const localConfig: GoogleRedisDatabaseEntityProviderConfig = {
                id: 'project',
                projectLocator: new GoogleProjectLocatorByConfig("project"),
                componentLabel: 'component',
                ownerLabel: 'otherOwner',
                resourceType: 'redis',
                suffix: "memorystore",
                resourceTransformer: defaultRedisResourceTransformer,
                schedule: {
                    frequency: { minutes: 30 },
                    timeout: { minutes: 3 },
                },
                disabled: true,
                namespaceByProject: false
            }
    

            const result = config.resourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": "my-project",
                        "backtostage.app/google-redis-database-version": "REDIS_4",
                    },
                    name: 'database-name-memorystore',
                    links: [{
                        url : `https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/database-name/details/overview?project=my-project`,
                        title: "Redis URL"
                    }]
                },
                spec: {
                    dependencyOf: [
                        'component:my-service'
                    ],
                    owner: 'default/unknown',
                    type: 'redis'
                }
            })
        })

        it('should use empty dependencies in a resource entity without label component defined in database label', () => {
            const localConfig: GoogleRedisDatabaseEntityProviderConfig = {
                id: 'project',
                projectLocator: new GoogleProjectLocatorByConfig("project"),
                componentLabel: 'otherComponent',
                ownerLabel: 'owner',
                resourceType: 'redis',
                suffix: "memorystore",
                resourceTransformer: defaultRedisResourceTransformer,
                schedule: {
                    frequency: { minutes: 30 },
                    timeout: { minutes: 3 },
                },
                disabled: true,
                namespaceByProject: false
            }
    

            const result = config.resourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": "my-project",
                        "backtostage.app/google-redis-database-version": "REDIS_4",
                    },
                    name: 'database-name-memorystore',
                    links: [{
                        url : `https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/database-name/details/overview?project=my-project`,
                        title: "Redis URL"
                    }]
                },
                spec: {
                    owner: 'default/owner',
                    type: 'redis'
                }
            })
        })

        it('should use empty values in a resource entity without user settings defined in database', () => {
            const localDatabase: redis_v1beta1.Schema$Instance = {
                name: 'projects/my-project/locations/us-central1/instances/database-name',
            }

            const result = config.resourceTransformer(config, localDatabase);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": "my-project",
                    },
                    name: 'database-name-memorystore',
                    links: [{
                        url : `https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/database-name/details/overview?project=my-project`,
                        title: "Redis URL"
                    }]
                },
                spec: {
                    owner: 'default/unknown',
                    type: 'redis'
                }
            })
        })

        it('should set namespace by project', () => {
            const localConfig: GoogleRedisDatabaseEntityProviderConfig = {
                id: 'project',
                projectLocator: new GoogleProjectLocatorByConfig("project"),
                componentLabel: 'component',
                ownerLabel: 'owner',
                resourceType: 'redis',
                suffix: "memorystore",
                resourceTransformer: defaultRedisResourceTransformer,
                schedule: {
                    frequency: { minutes: 30 },
                    timeout: { minutes: 3 },
                },
                disabled: true,
                namespaceByProject: true
            }
    

            const result = config.resourceTransformer(localConfig, database);
            expect(result).toEqual({
                kind: 'Resource',
                apiVersion: 'backstage.io/v1alpha1',
                metadata: {
                    annotations: {
                        [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:${config.id}`,
                        "backtostage.app/google-project": "my-project",
                        "backtostage.app/google-redis-database-version": "REDIS_4",
                    },
                    name: 'database-name-memorystore',
                    namespace: "my-project",
                    links: [{
                        url : `https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/database-name/details/overview?project=my-project`,
                        title: "Redis URL"
                    }]
                },
                spec: {
                    dependencyOf: [
                        'component:my-service'
                    ],
                    owner: 'default/owner',
                    type: 'redis'
                }
            })
        })
    })
})