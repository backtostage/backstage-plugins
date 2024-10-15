import { GoogleRedisDatabaseEntityProvider } from "./GoogleRedisDatabaseEntityProvider";
import { TaskInvocationDefinition, TaskRunner, } from '@backstage/backend-tasks';
import { ConfigReader } from '@backstage/config';
import { getVoidLogger } from '@backstage/backend-common';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import * as helpers from '../lib/redis';
import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION } from '@backstage/catalog-model';


jest.mock('../lib/redis', () => {
    return {
        listRedisInstances: jest.fn(),
    };
});

class PersistingTaskRunner implements TaskRunner {
    private tasks: TaskInvocationDefinition[] = [];

    getTasks() {
        return this.tasks;
    }

    run(task: TaskInvocationDefinition): Promise<void> {
        this.tasks.push(task);
        return Promise.resolve(undefined);
    }
}

const logger = getVoidLogger();
describe('GoogleRedisDatabaseEntityProvider', () => {
    afterEach(() => jest.resetAllMocks());

    it('should be defined', () => {
        expect(GoogleRedisDatabaseEntityProvider).toBeDefined()
    })


    it('no provider config', () => {
        const scheduler =  {
            createScheduledTaskRunner: jest.fn(),
          } as any; 
        const config = new ConfigReader({});
        const providers = GoogleRedisDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        });

        expect(providers).toHaveLength(0);
    });

    it('single simple provider config', () => {
        const scheduler =  {
            createScheduledTaskRunner: jest.fn(),
          } as any; 
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: [{
                        project: 'project',
                        schedule: {
                            frequency: { minutes: 30 },
                            timeout: { minutes: 3 },
                        }
                    }],
                },
            },
        });
        const providers = GoogleRedisDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        });

        expect(providers).toHaveLength(1);
        expect(providers[0].getProviderName()).toEqual('google-redis-database-entity-provider:project-wildcard');
    });

    it('multiple provider configs', () => {
        const scheduler =  {
            createScheduledTaskRunner: jest.fn(),
          } as any;          
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: [
                        {
                            project: 'myProvider',
                            schedule: {
                                frequency: { minutes: 30 },
                                timeout: { minutes: 3 },
                            }
                        },
                        {
                            project: 'anotherProvider',
                            schedule: {
                                frequency: { minutes: 30 },
                                timeout: { minutes: 3 },
                            },
                            redis: {
                                location: "us-central1"
                            }
                        },
                    ],
                },
            },
        });
        const providers = GoogleRedisDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        });

        expect(providers).toHaveLength(2);
        expect(providers[0].getProviderName()).toEqual(
            'google-redis-database-entity-provider:myProvider-wildcard',
        );
        expect(providers[1].getProviderName()).toEqual(
            'google-redis-database-entity-provider:anotherProvider-us-central1',
        );
    });

    it('apply full update on scheduled execution with simple config', async () => {
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: [{
                        project: 'myProvider',
                        schedule: {
                            frequency: { minutes: 30 },
                            timeout: { minutes: 3 },
                        }
                    }],
                },
            },
        });
        const schedule = new PersistingTaskRunner()
        const scheduler =  {
            createScheduledTaskRunner: jest.fn(_ => schedule),
          } as any;
        
        const entityProviderConnection: EntityProviderConnection = {
            applyMutation: jest.fn(),
            refresh: jest.fn(),
        };

        const provider = GoogleRedisDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        })[0];

        const mockListRedisInstances = jest.spyOn(
            helpers,
            'listRedisInstances',
        );

        mockListRedisInstances.mockReturnValue(
            Promise.resolve([
                {
                    name: "projects/myProvider/locations/us-central1/instances/database-name",                    
                    labels: {
                        owner: 'owner',
                        component: 'my-service',
                    }
                },
                {
                    name: 'projects/myProvider/locations/us-central1/instances/another-database-name',
                    labels: {
                        owner: 'owner2',
                        component: 'my-other-service',
                    }
                }
            ]),
        );

        await provider.connect(entityProviderConnection);

        const taskDef = schedule.getTasks()[0];
        expect(taskDef.id).toEqual('google-redis-database-entity-provider:myProvider-wildcard:refresh');
        await (taskDef.fn as () => Promise<void>)();

        const expectedEntities = [
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:myProvider`,
                            "backtostage.app/google-project": "myProvider",
                        },
                        name: 'database-name-redis',
                        links: [
                            {
                                title: "Redis URL",
                                url: "https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/database-name/details/overview?project=myProvider"
                            }
                        ],
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-service'
                        ],
                        owner: 'owner',
                        type: 'Memorystore Redis'
                    }
                },
                locationKey: 'google-redis-database-entity-provider:myProvider-wildcard',
            },
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:myProvider`,
                            "backtostage.app/google-project": "myProvider",
                        },
                        name: 'another-database-name-redis',
                        links: [
                            {
                                title: "Redis URL",
                                url: "https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/another-database-name/details/overview?project=myProvider"
                            }
                        ],
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-other-service'
                        ],
                        owner: 'owner2',
                        type: 'Memorystore Redis'
                    }
                },
                locationKey: 'google-redis-database-entity-provider:myProvider-wildcard',
            }

        ];

        expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
        expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
            type: 'full',
            entities: expectedEntities,
        });
    });

    it('skip resource when name not match the pattern', async () => {
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: [{
                        project: 'myProvider',
                        schedule: {
                            frequency: { minutes: 30 },
                            timeout: { minutes: 3 },
                        }
                    }],
                },
            },
        });
        const schedule = new PersistingTaskRunner()
        const scheduler =  {
            createScheduledTaskRunner: jest.fn(_ => schedule),
          } as any;
        
        const entityProviderConnection: EntityProviderConnection = {
            applyMutation: jest.fn(),
            refresh: jest.fn(),
        };

        const provider = GoogleRedisDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        })[0];

        const mockListRedisInstances = jest.spyOn(
            helpers,
            'listRedisInstances',
        );

        mockListRedisInstances.mockReturnValue(
            Promise.resolve([
                {
                    name: "STRANGER_NAME_FROM_GCP",                    
                    labels: {
                        owner: 'owner',
                        component: 'my-service',
                    }
                },
                {
                    name: 'projects/myProvider/locations/us-central1/instances/another-database-name',
                    labels: {
                        owner: 'owner2',
                        component: 'my-other-service',
                    }
                }
            ]),
        );

        await provider.connect(entityProviderConnection);

        const taskDef = schedule.getTasks()[0];
        expect(taskDef.id).toEqual('google-redis-database-entity-provider:myProvider-wildcard:refresh');
        await (taskDef.fn as () => Promise<void>)();

        const expectedEntities = [
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `google-redis-database-entity-provider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `google-redis-database-entity-provider:myProvider`,
                            "backtostage.app/google-project": "myProvider",
                        },
                        name: 'another-database-name-redis',
                        links: [
                            {
                                title: "Redis URL",
                                url: "https://console.cloud.google.com/memorystore/redis/locations/us-central1/instances/another-database-name/details/overview?project=myProvider"
                            }
                        ],
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-other-service'
                        ],
                        owner: 'owner2',
                        type: 'Memorystore Redis'
                    }
                },
                locationKey: 'google-redis-database-entity-provider:myProvider-wildcard',
            }

        ];

        expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
        expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
            type: 'full',
            entities: expectedEntities,
        });
    });
});