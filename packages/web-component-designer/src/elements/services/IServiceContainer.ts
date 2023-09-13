export interface IServiceContainer {
    register(name: string, service: any);
    getLastService(service: string): any;
    getServices(service: string): any[];
}