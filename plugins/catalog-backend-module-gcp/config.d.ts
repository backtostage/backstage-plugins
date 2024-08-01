
import { TaskScheduleDefinitionConfig } from '@backstage/backend-tasks';

export interface Config {
  catalog?: {
    providers?: {
      gcp?:
      Array<{
        project: string;
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

        cloudsql?: {
          /**
           * (Optional) The provider will set the Resource type based in this information.
           * Default: `CloudSQL`.
           */
          resourceType?: string;
        },
        
        redis?: {
          /**
           * (Optional) The provider will set the Resource type based in this information.
           * Default: `Memorystore Redis`.
           */
          resourceType?: string;
          /**
           * (Optional) The provider will use this location to retrieve instances.
           * Default: `Wildcard for all locations`.
           */
          location?: string;
        }

        /**
         * (Required) TaskScheduleDefinition for the refresh.
         */
        schedule?: TaskScheduleDefinitionConfig;
      }
      >;
    };
  };
}