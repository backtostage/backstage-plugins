import {ProjectsClient} from '@google-cloud/resource-manager';

export async function listProjects(parent?: string) {
    const resourcemanagerClient = new ProjectsClient();
    const request = {
        query: ""
      };
      
      if(parent) {
        request.query=`parent:organizations/${parent}`;
      }

      //we don't have to handle pagination here, the client will do it for us
      const result = await resourcemanagerClient.searchProjects(request);

      return result[0];
}
