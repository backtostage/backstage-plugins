import { EntityProvider, EntityProviderConnection, } from '@backstage/plugin-catalog-node';
import { Config } from "@backstage/config";
import { GoogleOrganizationProjectEntityProviderConfig, readProviderConfigs } from "./GoogleOrganizationProjectEntityProviderConfig";
import {  GoogleOrganizationProjectResourceTransformer } from "../transformers/defaultResourceTransformer";
import { TaskRunner } from '@backstage/backend-tasks';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import * as uuid from "uuid";
import { ResourceEntityV1alpha1 } from '@backstage/catalog-model';
import { listProjects } from '../lib/resourcemanager';


export class GoogleOrganizationProjectEntityProvider implements EntityProvider {
    private readonly logger: LoggerService;
    private readonly scheduleFn: () => Promise<void>;
    private connection?: EntityProviderConnection;

    static fromConfig(options: {
        config: Config,
        resourceTransformer?: GoogleOrganizationProjectResourceTransformer,
        logger: LoggerService,
        scheduler: SchedulerService;
    }) {

        return readProviderConfigs(options).map((providerConfig) => {
            return new GoogleOrganizationProjectEntityProvider(
                providerConfig,
                options.scheduler.createScheduledTaskRunner(providerConfig.schedule),
                options.logger
            )
        })
    }

    constructor(private config: GoogleOrganizationProjectEntityProviderConfig, taskRunner: TaskRunner, logger: LoggerService) {
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
        return `google-org-project-entity-provider:${this.config.position}`;
    }

    async refresh(logger: LoggerService) {
        if (!this.connection) {
            throw new Error('Not initialized');
        }
        logger.info(`Reading GCP Projects for query ${this.config.query}`);
        const databases = await listProjects(this.config.query)
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
                        class: GoogleOrganizationProjectEntityProvider.prototype.constructor.name,
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

