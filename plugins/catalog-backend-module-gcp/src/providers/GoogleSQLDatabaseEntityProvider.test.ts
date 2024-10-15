import { GoogleSQLDatabaseEntityProvider } from "./GoogleSQLDatabaseEntityProvider";
import { TaskInvocationDefinition, TaskRunner, } from '@backstage/backend-tasks';
import { ConfigReader } from '@backstage/config';
import { getVoidLogger } from '@backstage/backend-common';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import * as helpers from '../lib/sqladmin';
import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION } from '@backstage/catalog-model';


jest.mock('../lib/sqladmin', () => {
    return {
        listSQLInstances: jest.fn(),
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
describe('GoogleSQLDatabaseEntityProvider', () => {
    afterEach(() => jest.resetAllMocks());

    it('should be defined', () => {
        expect(GoogleSQLDatabaseEntityProvider).toBeDefined()
    })


    it('no provider config', () => {
        const scheduler =  {
            createScheduledTaskRunner: jest.fn(),
          } as any; 
        const config = new ConfigReader({});
        const providers = GoogleSQLDatabaseEntityProvider.fromConfig({
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
        const providers = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        });

        expect(providers).toHaveLength(1);
        expect(providers[0].getProviderName()).toEqual('google-sql-database-entity-provider:project');
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
                            }
                        },
                    ],
                },
            },
        });
        const providers = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        });

        expect(providers).toHaveLength(2);
        expect(providers[0].getProviderName()).toEqual(
            'google-sql-database-entity-provider:myProvider',
        );
        expect(providers[1].getProviderName()).toEqual(
            'google-sql-database-entity-provider:anotherProvider',
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

        const provider = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            scheduler,
        })[0];

        const mockListSQLInstances = jest.spyOn(
            helpers,
            'listSQLInstances',
        );

        mockListSQLInstances.mockReturnValue(
            Promise.resolve([
                {
                    name: 'database-name',
                    settings: {
                        userLabels: {
                            owner: 'owner',
                            component: 'my-service',
                        }
                    }
                },
                {
                    name: 'another-database-name',
                    settings: {
                        userLabels: {
                            owner: 'owner2',
                            component: 'my-other-service',
                        }
                    }
                }
            ]),
        );

        await provider.connect(entityProviderConnection);

        const taskDef = schedule.getTasks()[0];
        expect(taskDef.id).toEqual('google-sql-database-entity-provider:myProvider:refresh');
        await (taskDef.fn as () => Promise<void>)();

        const expectedEntities = [
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:myProvider`,
                        },
                        name: 'database-name-cloudsql',
                        title: "database-name-cloudsql",
                        links: [],
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-service'
                        ],
                        owner: 'owner',
                        type: 'CloudSQL'
                    }
                },
                locationKey: 'google-sql-database-entity-provider:myProvider',
            },
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `google-sql-database-entity-provider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `google-sql-database-entity-provider:myProvider`,
                        },
                        name: 'another-database-name-cloudsql',
                        title: "another-database-name-cloudsql",
                        links: [],
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-other-service'
                        ],
                        owner: 'owner2',
                        type: 'CloudSQL'
                    }
                },
                locationKey: 'google-sql-database-entity-provider:myProvider',
            }

        ];

        expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
        expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
            type: 'full',
            entities: expectedEntities,
        });
    });
});