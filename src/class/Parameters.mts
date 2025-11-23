/**
 * Client only
 * 
 * A class that stores parameters
 */
export class Parameters {
    private parametes : { [key: string]: any }

    constructor() {
        this.parametes = {}
    }

    /**
     * sets the value of the parameter
     * 
     * @param name The name of the parameter
     * @param value The value of the parameter
     */
    set(name: string, value: any) {
        this.parametes[name] = value
    }

    /**
     * returns the value of the parameter
     * 
     * @param name The name of the parameter
     * @returns the value of the parameter or null
     */
    get(name: string): any {
        return this.parametes[name] ?? null
    }
}