import { GoogleOrganizationProjectEntityProvider } from './GoogleOrganizationProjectEntityProvider';
import { TaskInvocationDefinition, TaskRunner } from '@backstage/backend-tasks';
import { ConfigReader } from '@backstage/config';
import { getVoidLogger } from '@backstage/backend-common';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import * as helpers from '../lib/resourcemanager';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';

jest.mock('../lib/resourcemanager', () => {
  return {
    listProjects: jest.fn(),
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
describe('GoogleOrganizationProjectEntityProvider', () => {
  afterEach(() => jest.resetAllMocks());

  it('should be defined', () => {
    expect(GoogleOrganizationProjectEntityProvider).toBeDefined();
  });

  it('no provider config', () => {
    const scheduler = {
      createScheduledTaskRunner: jest.fn(),
    } as any;
    const config = new ConfigReader({});
    const providers = GoogleOrganizationProjectEntityProvider.fromConfig({
      config,
      logger,
      scheduler,
    });

    expect(providers).toHaveLength(0);
  });

  it('single simple provider config', () => {
    const scheduler = {
      createScheduledTaskRunner: jest.fn(),
    } as any;
    const config = new ConfigReader({
      catalog: {
        providers: {
          gcp: [
            {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          ],
        },
      },
    });
    const providers = GoogleOrganizationProjectEntityProvider.fromConfig({
      config,
      logger,
      scheduler,
    });

    expect(providers).toHaveLength(1);
    expect(providers[0].getProviderName()).toEqual(
      'google-org-project-entity-provider:0',
    );
  });

  it('multiple provider configs', () => {
    const scheduler = {
      createScheduledTaskRunner: jest.fn(),
    } as any;
    const config = new ConfigReader({
      catalog: {
        providers: {
          gcp: [
            {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
            {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
              redis: {
                location: 'us-central1',
              },
            },
            {
              project: 'notOrganizationProvider',
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
              redis: {
                location: 'us-central1',
              },
            },
          ],
        },
      },
    });
    const providers = GoogleOrganizationProjectEntityProvider.fromConfig({
      config,
      logger,
      scheduler,
    });

    expect(providers).toHaveLength(2);
    expect(providers[0].getProviderName()).toEqual(
      'google-org-project-entity-provider:0',
    );
    expect(providers[1].getProviderName()).toEqual(
      'google-org-project-entity-provider:1',
    );
  });

  it('apply full update on scheduled execution with simple config', async () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          gcp: [
            {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          ],
        },
      },
    });
    const schedule = new PersistingTaskRunner();
    const scheduler = {
      createScheduledTaskRunner: jest.fn(_ => schedule),
    } as any;

    const entityProviderConnection: EntityProviderConnection = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    };

    const provider = GoogleOrganizationProjectEntityProvider.fromConfig({
      config,
      logger,
      scheduler,
    })[0];

    const mockListProjects = jest.spyOn(helpers, 'listProjects');

    mockListProjects.mockReturnValue(
      Promise.resolve([
        {
          name: 'projects/2381927312312',
          parent: 'folders/12312321',
          projectId: 'sys-43434343',
          displayName: 'MeuProjeto1',
          labels: {
            owner: 'owner',
            component: 'my-service',
            labelExtra: 'extra',
          },
        },
        {
          name: 'projects/781297321',
          parent: 'folders/17812237981273',
          projectId: 'sys-24365465',
          displayName: 'MeuProjeto2',
          labels: {
            owner: 'owner2',
            component: 'my-other-service',
            labelExtra: 'extra',
          },
        },
      ]),
    );

    await provider.connect(entityProviderConnection);

    const taskDef = schedule.getTasks()[0];
    expect(taskDef.id).toEqual('google-org-project-entity-provider:0:refresh');
    await (taskDef.fn as () => Promise<void>)();

    const expectedEntities = [
      {
        entity: {
          kind: 'Resource',
          apiVersion: 'backstage.io/v1alpha1',
          metadata: {
            annotations: {
              [ANNOTATION_LOCATION]: `google-org-project-entity-provider:0`,
              [ANNOTATION_ORIGIN_LOCATION]: `google-org-project-entity-provider:0`,
              'backtostage.app/google-project': 'sys-43434343',
            },
            name: 'sys-43434343',
            description: 'MeuProjeto1',
            links: [
              {
                title: 'Project URL',
                url: 'https://console.cloud.google.com/?project=sys-43434343',
              },
            ],
            labels: {
              owner: 'owner',
              component: 'my-service',
              labelExtra: 'extra',
            },
          },
          spec: {
            dependencyOf: ['component:my-service'],
            owner: 'owner',
            type: 'GCP Project',
          },
        },
        locationKey: 'google-org-project-entity-provider:0',
      },
      {
        entity: {
          kind: 'Resource',
          apiVersion: 'backstage.io/v1alpha1',
          metadata: {
            annotations: {
              [ANNOTATION_LOCATION]: `google-org-project-entity-provider:0`,
              [ANNOTATION_ORIGIN_LOCATION]: `google-org-project-entity-provider:0`,
              'backtostage.app/google-project': 'sys-24365465',
            },
            name: 'sys-24365465',
            description: 'MeuProjeto2',
            links: [
              {
                title: 'Project URL',
                url: 'https://console.cloud.google.com/?project=sys-24365465',
              },
            ],
            labels: {
              owner: 'owner2',
              component: 'my-other-service',
              labelExtra: 'extra',
            },
          },
          spec: {
            dependencyOf: ['component:my-other-service'],
            owner: 'owner2',
            type: 'GCP Project',
          },
        },
        locationKey: 'google-org-project-entity-provider:0',
      },
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
          gcp: [
            {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          ],
        },
      },
    });
    const schedule = new PersistingTaskRunner();
    const scheduler = {
      createScheduledTaskRunner: jest.fn(_ => schedule),
    } as any;

    const entityProviderConnection: EntityProviderConnection = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    };

    const provider = GoogleOrganizationProjectEntityProvider.fromConfig({
      config,
      logger,
      scheduler,
    })[0];

    const mockListProjects = jest.spyOn(helpers, 'listProjects');

    mockListProjects.mockReturnValue(
      Promise.resolve([
        {
          name: 'STRANGER_NAME_FROM_GCP',
          parent: 'folders/17812237981273',
          projectId: 'sys-24365465',
          displayName: 'MeuProjeto1',
          labels: {
            owner: 'owner2',
            component: 'my-other-service',
            labelExtra: 'extra',
          },
        },
        {
          name: 'projects/781297321',
          parent: 'folders/17812237981273',
          projectId: 'sys-24365465',
          displayName: 'MeuProjeto2',
          labels: {
            owner: 'owner2',
            component: 'my-other-service',
            labelExtra: 'extra',
          },
        },
      ]),
    );

    await provider.connect(entityProviderConnection);

    const taskDef = schedule.getTasks()[0];
    expect(taskDef.id).toEqual('google-org-project-entity-provider:0:refresh');
    await (taskDef.fn as () => Promise<void>)();

    const expectedEntities = [
      {
        entity: {
          kind: 'Resource',
          apiVersion: 'backstage.io/v1alpha1',
          metadata: {
            annotations: {
              [ANNOTATION_LOCATION]: `google-org-project-entity-provider:0`,
              [ANNOTATION_ORIGIN_LOCATION]: `google-org-project-entity-provider:0`,
              'backtostage.app/google-project': 'sys-24365465',
            },
            name: 'sys-24365465',
            description: 'MeuProjeto2',
            links: [
              {
                title: 'Project URL',
                url: 'https://console.cloud.google.com/?project=sys-24365465',
              },
            ],
            labels: {
              owner: 'owner2',
              component: 'my-other-service',
              labelExtra: 'extra',
            },
          },
          spec: {
            dependencyOf: ['component:my-other-service'],
            owner: 'owner2',
            type: 'GCP Project',
          },
        },
        locationKey: 'google-org-project-entity-provider:0',
      },
    ];

    expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
      type: 'full',
      entities: expectedEntities,
    });
  });
});
