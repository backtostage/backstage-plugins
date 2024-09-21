import { Config } from '@backstage/config';
import { GoogleProjectLocator } from './types';
import { GoogleProjectLocatorByConfig } from './GoogleProjectLocatorByConfig';
import { GoogleProjectLocatorByOrganization } from './GoogleProjectLocatorByOrganization';

export type { GoogleProjectLocator } from './types';



export function getProjectLocator(config: Config): GoogleProjectLocator {
    const project = config.getOptionalString('project');
    if (project) {
        return new GoogleProjectLocatorByConfig(project)
    } 
        const query = config.getOptionalString("organization.query");
        return new GoogleProjectLocatorByOrganization(query)
    
}
