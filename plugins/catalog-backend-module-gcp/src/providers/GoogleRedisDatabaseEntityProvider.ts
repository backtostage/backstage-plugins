import { EntityProvider, EntityProviderConnection, } from '@backstage/plugin-catalog-node';
import { Config } from "@backstage/config";
import { GoogleRedisDatabaseEntityProviderConfig, readProviderConfigs } from "./GoogleRedisDatabaseEntityProviderConfig";
import { GoogleRedisResourceTransformer } from "../transformers/defaultResourceTransformer";
import { TaskRunner } from '@backstage/backend-tasks';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import * as uuid from "uuid";
import { listRedisInstances } from "../lib/redis";
import { ResourceEntityV1alpha1 } from '@backstage/catalog-model';


export class GoogleRedisDatabaseEntityProvider implements EntityProvider {
    private readonly logger: LoggerService;
    private readonly scheduleFn: () => Promise<void>;
    private connection?: EntityProviderConnection;

    static fromConfig(options: {
        config: Config,
        resourceTransformer?: GoogleRedisResourceTransformer,
        logger: LoggerService,
        scheduler: SchedulerService;
    }) {

        return readProviderConfigs(options).map((providerConfig) => {
            return new GoogleRedisDatabaseEntityProvider(
                providerConfig,
                options.scheduler.createScheduledTaskRunner(providerConfig.schedule),
                options.logger
            )
        })
    }

    constructor(private config: GoogleRedisDatabaseEntityProviderConfig, taskRunner: TaskRunner, logger: LoggerService) {
        this.scheduleFn = this.createScheduleFn(taskRunner);
        this.logger = logger.child({
            target: this.getProviderName(),
        });
    }

    async connect(connection: EntityProviderConnection): Promise<void> {
        this.connection = connection;
        return await this.scheduleFn();
    }


    getProviderName(): string {
        return `google-redis-database-entity-provider:${this.config.id}-${this.config.location?? 'wildcard'}`;
    }

    async refresh(logger: LoggerService) {
        if (!this.connection) {
            throw new Error('Not initialized');
        }
        logger.info(`Reading GCP Redis Instances`)

        const projects = await this.config.projectLocator.getProjects();
        const allResources: ResourceEntityV1alpha1[] = [];

        logger.info(`Found ${projects.length} projects`)

        for (const project of projects) {
            logger.info(`Reading GCP Redis Instances for project ${project} in location ${this.config.location}`);
            try {
                const databases = await listRedisInstances(project, this.config.location)
                const resources: ResourceEntityV1alpha1[] = []
                for (let index = 0; index < databases.length; index++) {
                    const db = databases[index];
                    try {
                        const result = this.config.resourceTransformer(this.config, db)
                        if(result) resources.push(result)
                    } catch (error) {
                        logger.error(`Error to transform ${db} - ${error}`)
                    }
                }
                allResources.push(...resources); 
            } catch (error) {
                logger.error(`Error to list databases for project ${project} - ${error}`)
            }
        }

        await this.connection.applyMutation({
            type: 'full',
            entities: allResources.map(entity => ({
                entity,
                locationKey: this.getProviderName(),
            })),
        });

    }
    private createScheduleFn(taskRunner: TaskRunner): () => Promise<void> {
        return async () => {
            const taskId = `${this.getProviderName()}:refresh`;
            return taskRunner.run({
                id: taskId,
                fn: async () => {
                    const logger = this.logger.child({
                        class: GoogleRedisDatabaseEntityProvider.prototype.constructor.name,
                        taskId,
                        taskInstanceId: uuid.v4(),
                    });
                    try {
                        await this.refresh(logger);
                    } catch (error) {
                        logger.error(`${this.getProviderName()} run failed ${error}`);
                    }
                },
            });
        };
    }

}

