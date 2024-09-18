import { ConfigReader } from '@backstage/config';
import { readProviderConfigs } from './GoogleOrganizationProjectEntityProviderConfig';

describe('readProviderConfigs', () => {
  afterEach(() => jest.resetAllMocks());

  it('no provider config', () => {
    const config = new ConfigReader({});
    const providerConfigs = readProviderConfigs({ config });

    expect(providerConfigs).toHaveLength(0);
  });

  it('remove disabled provider config', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          gcp: [
            {
              project: 'xpto',
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
            {
              organization: {
                disabled: true,
              },
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          ],
        },
      },
    });
    const providerConfigs = readProviderConfigs({ config });

    expect(providerConfigs).toHaveLength(0);
  });

  it('single simple provider config', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          gcp: [
            {
              organization: {
                query: 'parent:organizations/123',
              },
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          ],
        },
      },
    });
    const providerConfigs = readProviderConfigs({ config });

    expect(providerConfigs).toHaveLength(1);
    expect(providerConfigs[0].query).toEqual('parent:organizations/123');
    expect(providerConfigs[0].ownerLabel).toEqual('owner');
    expect(providerConfigs[0].componentLabel).toEqual('component');
    expect(providerConfigs[0].resourceType).toEqual('GCP Project');
    expect(providerConfigs[0].resourceTransformer).toBeDefined();
    expect(providerConfigs[0].schedule).toBeDefined();
  });

  it('multiple provider configs', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          gcp: [
            {
              schedule: {
                frequency: { minutes: 10 },
                timeout: { minutes: 3 },
              },
            },
            {
              ownerLabel: 'team',
              componentLabel: 'app',
              organization: {
                resourceType: 'Project',
              },
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          ],
        },
      },
    });
    const providerConfigs = readProviderConfigs({ config });

    expect(providerConfigs).toHaveLength(2);
    expect(providerConfigs[0]).toEqual({
      position: 0,
      ownerLabel: 'owner',
      componentLabel: 'component',
      resourceType: 'GCP Project',
      resourceTransformer: expect.any(Function),
      schedule: {
        frequency: { minutes: 10 },
        timeout: { minutes: 3 },
      },
      disabled: false,
    });

    expect(providerConfigs[1]).toEqual({
      position: 1,
      ownerLabel: 'team',
      componentLabel: 'app',
      resourceType: 'Project',
      resourceTransformer: expect.any(Function),
      disabled: false,
      schedule: {
        frequency: { minutes: 30 },
        timeout: { minutes: 3 },
      },
    });
  });
});
