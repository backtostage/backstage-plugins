import {ProjectsClient} from '@google-cloud/resource-manager';

export async function listProjects(query?: string) {
    const resourcemanagerClient = new ProjectsClient();
    const request = {
        query
      };

      // we don't have to handle pagination here, the client will do it for us
      const result = await resourcemanagerClient.searchProjects(request);
      return result[0];
}
