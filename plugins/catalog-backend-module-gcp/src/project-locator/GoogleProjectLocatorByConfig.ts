import { GoogleProjectLocator } from "./types";

export class GoogleProjectLocatorByConfig implements GoogleProjectLocator {
    constructor(private readonly project: string) {}
    async getProjects() {
        return [this.project];
    }
}