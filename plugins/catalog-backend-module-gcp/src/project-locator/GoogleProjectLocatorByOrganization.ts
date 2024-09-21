import { GoogleProjectLocator } from "./types";
import { listProjects } from '../lib/resourcemanager';

export class GoogleProjectLocatorByOrganization implements GoogleProjectLocator {
    constructor(private readonly query?: string) {}
    async getProjects() {
        const projects = await listProjects(this.query);
        return projects
            .map(project => project.projectId )
            .filter(project => !!project) as string[];
    }
}