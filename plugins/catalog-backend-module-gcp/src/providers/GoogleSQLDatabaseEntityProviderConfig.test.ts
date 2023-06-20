import {ConfigReader} from '@backstage/config';
import {readProviderConfigs} from "./GoogleSQLDatabaseEntityProviderConfig";

describe('readProviderConfigs', () => {
    afterEach(() => jest.resetAllMocks());


    it('no provider config', () => {
        const config = new ConfigReader({});
        const providerConfigs = readProviderConfigs({config});

        expect(providerConfigs).toHaveLength(0);
    });

    it('single simple provider config', () => {
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: {
                        'my-project': {},
                    },
                },
            },
        });
        const providerConfigs = readProviderConfigs({config});

        expect(providerConfigs).toHaveLength(1);
        expect(providerConfigs[0].project).toEqual('my-project');
        expect(providerConfigs[0].ownerLabel).toEqual('owner');
        expect(providerConfigs[0].componentLabel).toEqual('component');
        expect(providerConfigs[0].resourceType).toEqual('CloudSQL');
        expect(providerConfigs[0].resourceTransformer).toBeDefined();
    });

    it('multiple provider configs', () => {
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: {
                        'my-project': {},
                        'my-other-project': {
                            ownerLabel: 'team',
                            componentLabel: 'app',
                            resourceType: 'SQL',
                            schedule: {
                                frequency: {minutes: 30},
                                timeout: {minutes: 3},
                            },
                        },
                    },
                }
            },
        });
        const providerConfigs = readProviderConfigs({config});

        expect(providerConfigs).toHaveLength(2);
        expect(providerConfigs[0]).toEqual({
            project: 'my-project',
            ownerLabel: 'owner',
            componentLabel: 'component',
            resourceType: 'CloudSQL',
            resourceTransformer: expect.any(Function)
        });

        expect(providerConfigs[1]).toEqual({
            project: 'my-other-project',
            ownerLabel: 'team',
            componentLabel: 'app',
            resourceType: 'SQL',
            resourceTransformer: expect.any(Function),
            schedule: {
                frequency: { minutes: 30},
                timeout: { minutes: 3 },
            },
        });

    });

})