import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-node';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { catalogModuleGoogleSQLDatabaseEntityProvider } from './catalogModuleGoogleSQLDatabaseEntityProvider';

describe('catalogModuleGoogleSQLDatabaseEntityProvider', () => {
  it('should register provider at the catalog extension point', async () => {
    let addedProviders: Array<EntityProvider> | undefined;
    let usedSchedule: SchedulerServiceTaskScheduleDefinition | undefined;

    const extensionPoint = {
      addEntityProvider: (...providers: any) => {
        addedProviders = providers;
      },
    };
    const runner = jest.fn();
    const scheduler = mockServices.scheduler.mock({
      createScheduledTaskRunner(schedule) {
        usedSchedule = schedule;
        return { run: runner };
      },
    });

    const config = {
        catalog: {
            providers: {
                gcp: [
                    {
                        project: 'my-project',
                        schedule: {
                            frequency: { minutes: 30 },
                            timeout: { minutes: 3 },
                        }
                    },
                ],
            },
        },
    };

    await startTestBackend({
      extensionPoints: [[catalogProcessingExtensionPoint, extensionPoint]],
      features: [
        catalogModuleGoogleSQLDatabaseEntityProvider,
        mockServices.rootConfig.factory({ data: config }),
        scheduler.factory,
      ],
    });

    expect(usedSchedule?.frequency).toEqual({ minutes: 30 });
    expect(usedSchedule?.timeout).toEqual({ minutes: 3 });
    expect(addedProviders?.length).toEqual(1);
    expect(addedProviders![0][0].getProviderName()).toEqual(
      'google-sql-database-entity-provider:my-project',
    );
    expect(runner).not.toHaveBeenCalled();
  });
});