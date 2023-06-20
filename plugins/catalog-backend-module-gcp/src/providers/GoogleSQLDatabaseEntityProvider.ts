import {EntityProvider, EntityProviderConnection,} from '@backstage/plugin-catalog-node';
import {Logger} from "winston";
import {Config} from "@backstage/config";
import {GoogleSQLDatabaseEntityProviderConfig, readProviderConfigs} from "./GoogleSQLDatabaseEntityProviderConfig";
import {GoogleDatabaseResourceTransformer} from "../transformers/defaultResourceTransformer";
import {PluginTaskScheduler, TaskRunner} from '@backstage/backend-tasks';
import * as uuid from "uuid";
import {listSQLInstances} from "../lib/sqladmin";


export class GoogleSQLDatabaseEntityProvider implements EntityProvider {
    private readonly logger: Logger;
    private readonly scheduleFn: () => Promise<void>;
    private connection?: EntityProviderConnection;

    static fromConfig(options: {
        config: Config,
        resourceTransformer?: GoogleDatabaseResourceTransformer,
        logger: Logger,
        schedule?: TaskRunner;
        scheduler?: PluginTaskScheduler;
    }) {
        if (!options.schedule && !options.scheduler) {
            throw new Error('Either schedule or scheduler must be provided.');
        }

        return readProviderConfigs(options).map((providerConfig) => {
            const taskRunner =
                options.schedule ??
                options.scheduler!.createScheduledTaskRunner(providerConfig.schedule!);

            return new GoogleSQLDatabaseEntityProvider(providerConfig, taskRunner, options.logger)
        })
    }

    constructor(private config: GoogleSQLDatabaseEntityProviderConfig, taskRunner: TaskRunner, logger: Logger) {
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
        return `GoogleSQLDatabaseEntityProvider:${this.config.project}`;
    }

    async refresh(logger: Logger) {
        if (!this.connection) {
            throw new Error('Not initialized');
        }
        logger.info(`Reading GCP SQL Instances for project ${this.config.project}`);
        const databases = await listSQLInstances(this.config.project)
        const resources = databases.map(db => this.config.resourceTransformer(this.config, db));

        await this.connection.applyMutation({
            type: 'full',
            entities: resources.map(entity => ({
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
                        logger.error(`${this.getProviderName()} run failed`, error);
                    }
                },
            });
        };
    }

}

