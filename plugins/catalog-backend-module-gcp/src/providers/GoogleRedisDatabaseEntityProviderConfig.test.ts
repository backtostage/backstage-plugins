import { ConfigReader } from '@backstage/config';
import { readProviderConfigs } from "./GoogleRedisDatabaseEntityProviderConfig";

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
                            project: 'my-project',
                            redis: { disabled: true },
                            schedule: {
                                frequency: { minutes: 10 },
                                timeout: { minutes: 3 },
                            }
                        },
                        {
                            project: 'my-other-project',
                            ownerLabel: 'team',
                            componentLabel: 'app',
                            redis: { disabled: true },
                            schedule: {
                                frequency: { minutes: 30 },
                                timeout: { minutes: 3 },
                            },
                        },
                    ],
                }
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
                            project: 'my-project',
                            schedule: {
                                frequency: { minutes: 30 },
                                timeout: { minutes: 3 },
                            }
                        },
                    ],
                },
            },
        });
        const providerConfigs = readProviderConfigs({ config });

        expect(providerConfigs).toHaveLength(1);
        expect(providerConfigs[0].id).toEqual('my-project');
        expect(providerConfigs[0].ownerLabel).toEqual('owner');
        expect(providerConfigs[0].componentLabel).toEqual('component');
        expect(providerConfigs[0].resourceType).toEqual('Memorystore Redis');
        expect(providerConfigs[0].suffix).toEqual('redis');
        expect(providerConfigs[0].disabled).toBeFalsy();
        expect(providerConfigs[0].namespaceByProject).toBeFalsy();
        expect(providerConfigs[0].resourceTransformer).toBeDefined();
        expect(providerConfigs[0].schedule).toBeDefined();

    });

    it('multiple provider configs', () => {
        const config = new ConfigReader({
            catalog: {
                providers: {
                    gcp: [
                        {
                            project: 'my-project',
                            schedule: {
                                frequency: { minutes: 10 },
                                timeout: { minutes: 3 },
                            }
                        },
                        {
                            project: 'my-other-project',
                            ownerLabel: 'team',
                            componentLabel: 'app',
                            redis: { resourceType: 'database', location: "us-central1", suffix: "database", namespaceByProject: true },
                            schedule: {
                                frequency: { minutes: 30 },
                                timeout: { minutes: 3 },
                            },
                        },
                    ],
                }
            },
        });
        const providerConfigs = readProviderConfigs({ config });

        expect(providerConfigs).toHaveLength(2);
        expect(providerConfigs[0]).toEqual({
            id: 'my-project',
            projectLocator: expect.objectContaining({
                project: 'my-project',
            }),
            ownerLabel: 'owner',
            componentLabel: 'component',
            systemLabel: 'system',
            resourceType: 'Memorystore Redis',
            suffix: 'redis',
            schedule: {
                frequency: { minutes: 10 },
                timeout: { minutes: 3 },
                initialDelay: undefined,
                scope: undefined
            },
            disabled: false,
            namespaceByProject: false,
            location: undefined,
            resourceTransformer: expect.any(Function),
        });

        expect(providerConfigs[1]).toEqual({
            id: 'my-other-project',
            projectLocator: expect.objectContaining({
                project: 'my-other-project',
            }),
            ownerLabel: 'team',
            componentLabel: 'app',
            systemLabel: 'system',
            resourceType: 'database',
            suffix: "database",
            resourceTransformer: expect.any(Function),
            location: "us-central1",
            schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
                initialDelay: undefined,
                scope: undefined
            },
            disabled: false,
            namespaceByProject: true
        });

    });

})
