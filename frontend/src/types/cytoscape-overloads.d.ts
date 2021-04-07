import { Core } from 'cytoscape';
declare module 'cytoscape' {
    interface Core {
        cyCanvas?: any
    }
}