import { EntityProvider, EntityProviderConnection, } from '@backstage/plugin-catalog-node';
import { Config } from "@backstage/config";
import { GoogleSQLDatabaseEntityProviderConfig, readProviderConfigs } from "./GoogleSQLDatabaseEntityProviderConfig";
import { GoogleDatabaseResourceTransformer } from "../transformers/defaultResourceTransformer";
import { TaskRunner } from '@backstage/backend-tasks';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import * as uuid from "uuid";
import { listSQLInstances } from "../lib/sqladmin";
import { ResourceEntityV1alpha1 } from '@backstage/catalog-model';


export class GoogleSQLDatabaseEntityProvider implements EntityProvider {
    private readonly logger: LoggerService;
    private readonly scheduleFn: () => Promise<void>;
    private connection?: EntityProviderConnection;

    static fromConfig(options: {
        config: Config,
        resourceTransformer?: GoogleDatabaseResourceTransformer,
        logger: LoggerService,
        scheduler: SchedulerService;
    }) {

        return readProviderConfigs(options).map((providerConfig) => {
            return new GoogleSQLDatabaseEntityProvider(
                providerConfig,
                options.scheduler.createScheduledTaskRunner(providerConfig.schedule),
                options.logger
            )
        })
    }

    constructor(private config: GoogleSQLDatabaseEntityProviderConfig, taskRunner: TaskRunner, logger: LoggerService) {
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
        return `google-sql-database-entity-provider:${this.config.id}`;
    }

    async refresh(logger: LoggerService) {
        if (!this.connection) {
            throw new Error('Not initialized');
        }
        logger.info(`Reading GCP SQL Instances`);


        const projects = await this.config.projectLocator.getProjects();
        const allResources: ResourceEntityV1alpha1[] = [];
        logger.info(`Found ${projects.length} projects`);
        
        for (const project of projects) {
            try {
                logger.info(`Reading GCP SQL Instances for project ${project}`);
                const databases = await listSQLInstances(project)
                const resources = databases.map(db => this.config.resourceTransformer(this.config, db));
                allResources.push(...resources);
            } catch (error) {
                logger.error(`Error reading GCP SQL Instances for project ${project} - ${error}`);
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
                        class: GoogleSQLDatabaseEntityProvider.prototype.constructor.name,
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

