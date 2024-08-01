import {google, redis_v1beta1} from "googleapis";

const redisApi = google.redis('v1beta1');

export async function listRedisInstances(project: string, location?: string) {

    const client = await google.auth.getClient({
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
        ]
    })
    
    // when location is not provided, we use `-` for wildcard
    // ref https://cloud.google.com/memorystore/docs/redis/reference/rest/v1beta1/projects.locations.instances/list
    const parent = `projects/${project}/locations/${location?? '-'}`

    const request: redis_v1beta1.Params$Resource$Projects$Locations$Instances$List = {
        parent,
        auth: client,
    };

    const dbs: redis_v1beta1.Schema$Instance[] = []
    do {
        const response = await redisApi.projects.locations.instances.list(request);
        if (!response) return []
        const result = response.data

        const itemsPage = result.instances;
        if (!itemsPage) {
            return [];
        }
        dbs.push(...itemsPage)
        request.pageToken = result.nextPageToken ?? undefined;
    } while (request.pageToken)

    return dbs;
}
