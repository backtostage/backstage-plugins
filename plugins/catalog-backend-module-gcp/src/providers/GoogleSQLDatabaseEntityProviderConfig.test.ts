import { ConfigReader } from '@backstage/config';
import { readProviderConfigs } from "./GoogleSQLDatabaseEntityProviderConfig";

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
                            cloudsql: { disabled: true },
                            schedule: {
                                frequency: { minutes: 10 },
                                timeout: { minutes: 3 },
                            }
                        },
                        {
                            project: 'my-other-project',
                            ownerLabel: 'team',
                            componentLabel: 'app',
                            cloudsql: { disabled: true },
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
        expect(providerConfigs[0].resourceType).toEqual('CloudSQL');
        expect(providerConfigs[0].suffix).toEqual('cloudsql');
        expect(providerConfigs[0].resourceTransformer).toBeDefined();
        expect(providerConfigs[0].schedule).toBeDefined();
        expect(providerConfigs[0].disabled).toBeFalsy();
        expect(providerConfigs[0].namespaceByProject).toBeFalsy();

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
                            cloudsql: { resourceType: 'SQL', },
                            schedule: {
                                frequency: { minutes: 30 },
                                timeout: { minutes: 3 },
                            },
                        },
                        {
                            organization: {
                                query: 'parent:organizations/my-org'
                            },
                            ownerLabel: 'team',
                            componentLabel: 'app',
                            cloudsql: { resourceType: 'SQL', suffix: "sql", namespaceByProject: true },
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

        expect(providerConfigs).toHaveLength(3);

        expect(providerConfigs[0]).toEqual({
            id: 'my-project',
            projectLocator: {
                project: 'my-project',
            },
            ownerLabel: 'owner',
            componentLabel: 'component',
            resourceType: 'CloudSQL',
            suffix: "cloudsql",
            resourceTransformer: expect.any(Function),
            schedule: {
                frequency: { minutes: 10 },
                timeout: { minutes: 3 },
            },
            disabled: false,
            namespaceByProject: false
        });

        expect(providerConfigs[1]).toEqual({
            id: 'my-other-project',
            projectLocator: {
                project: 'my-other-project',
            },
            ownerLabel: 'team',
            componentLabel: 'app',
            resourceType: 'SQL',
            suffix: "cloudsql",
            resourceTransformer: expect.any(Function),
            schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
            },
            disabled: false,
            namespaceByProject: false
        });

        expect(providerConfigs[2]).toEqual({
            id: 'organization',
            projectLocator: {
                query: 'parent:organizations/my-org'
            },
            ownerLabel: 'team',
            componentLabel: 'app',
            resourceType: 'SQL',
            suffix: "sql",
            resourceTransformer: expect.any(Function),
            schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
            },
            disabled: false,
            namespaceByProject: true
        });

    });

})