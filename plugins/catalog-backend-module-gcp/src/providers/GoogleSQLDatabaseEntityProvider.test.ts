import {GoogleSQLDatabaseEntityProvider} from "./GoogleSQLDatabaseEntityProvider";
import {TaskInvocationDefinition, TaskRunner,} from '@backstage/backend-tasks';
import {ConfigReader} from '@backstage/config';
import {getVoidLogger} from '@backstage/backend-common';
import {EntityProviderConnection} from "@backstage/plugin-catalog-node";
import * as helpers from '../lib/sqladmin';
import {ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION} from "@backstage/catalog-model";


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
        const schedule = new PersistingTaskRunner();
        const config = new ConfigReader({});
        const providers = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            schedule,
        });

        expect(providers).toHaveLength(0);
    });

    it('single simple provider config', () => {
        const schedule = new PersistingTaskRunner();
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: {
                        project: {},
                    },
                },
            },
        });
        const providers = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            schedule,
        });

        expect(providers).toHaveLength(1);
        expect(providers[0].getProviderName()).toEqual('GoogleSQLDatabaseEntityProvider:project');
    });

    it('multiple provider configs', () => {
        const schedule = new PersistingTaskRunner();
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: {
                        myProvider: {},
                        anotherProvider: {},
                    },
                },
            },
        });
        const providers = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            schedule,
        });

        expect(providers).toHaveLength(2);
        expect(providers[0].getProviderName()).toEqual(
            'GoogleSQLDatabaseEntityProvider:myProvider',
        );
        expect(providers[1].getProviderName()).toEqual(
            'GoogleSQLDatabaseEntityProvider:anotherProvider',
        );
    });

    it('apply full update on scheduled execution with simple config', async () => {
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: {
                        myProvider: {},
                    },
                },
            },
        });
        const schedule = new PersistingTaskRunner();
        const entityProviderConnection: EntityProviderConnection = {
            applyMutation: jest.fn(),
            refresh: jest.fn(),
        };

        const provider = GoogleSQLDatabaseEntityProvider.fromConfig({
            config,
            logger,
            schedule,
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
        expect(taskDef.id).toEqual('GoogleSQLDatabaseEntityProvider:myProvider:refresh');
        await (taskDef.fn as () => Promise<void>)();

        const expectedEntities = [
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `GoogleSQLDatabaseEntityProvider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `GoogleSQLDatabaseEntityProvider:myProvider`,
                        },
                        name: 'database-name',
                        title: "database-name",
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-service'
                        ],
                        owner: 'owner',
                        type: 'CloudSQL'
                    }
                },
                locationKey: 'GoogleSQLDatabaseEntityProvider:myProvider',
            },
            {
                entity: {
                    kind: 'Resource',
                    apiVersion: 'backstage.io/v1alpha1',
                    metadata: {
                        annotations: {
                            [ANNOTATION_LOCATION]: `GoogleSQLDatabaseEntityProvider:myProvider`,
                            [ANNOTATION_ORIGIN_LOCATION]: `GoogleSQLDatabaseEntityProvider:myProvider`,
                        },
                        name: 'another-database-name',
                        title: "another-database-name",
                    },
                    spec: {
                        dependencyOf: [
                            'component:my-other-service'
                        ],
                        owner: 'owner2',
                        type: 'CloudSQL'
                    }
                },
                locationKey: 'GoogleSQLDatabaseEntityProvider:myProvider',
            }

        ];

        expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
        expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
            type: 'full',
            entities: expectedEntities,
        });
    });
});