import {google, sqladmin_v1beta4} from "googleapis";

const sqlAdmin = google.sqladmin('v1beta4');

export async function listSQLInstances(project: string) {

    const client = await google.auth.getClient({
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/sqlservice.admin']
    })

    const request: sqladmin_v1beta4.Params$Resource$Instances$List = {
        project: project,
        auth: client,
    };

    const dbs: sqladmin_v1beta4.Schema$DatabaseInstance[] = []
    do {
        const response = await sqlAdmin.instances.list(request);
        if (!response) return []
        const result = response.data

        const itemsPage = result.items;
        if (!itemsPage) {
            return [];
        }
        dbs.push(...itemsPage)
        request.pageToken = result.nextPageToken ?? undefined;
    } while (request.pageToken)

    return dbs;
}
