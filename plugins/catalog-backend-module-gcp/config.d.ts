
import { TaskScheduleDefinitionConfig } from '@backstage/backend-tasks';

export interface Config {
  catalog?: {
    providers?: {
      /**
       * GithubEntityProvider configuration
       *
       * Uses "default" as default id for the single config variant.
       */
      gcp?:
        Record<
            string,
            {
              /**
               * (Optional) The provider will look for user defined labels to find the Resource Owner.
               * Default: `owner`.
               */
              ownerLabel?: string;
              /**
               * (Optional) The provider will look for user defined labels to find the Resource dependencyOf.
               * Default: `component`.
               */
              componentLabel?: string;
              /**
               * (Optional) The provider will set the Resource type based in this information.
               * Default: `CloudSQL`.
               */
              resourceType?: string;
              /**
               * (Optional) TaskScheduleDefinition for the refresh.
               */
              schedule?: TaskScheduleDefinitionConfig;
            }
          >;
    };
  };
}