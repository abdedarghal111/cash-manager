/**
 * Fichero que contiene todos los arreglos y modificaciones que se tienen que establecer para cada versión atrasada
 * 
 * Importante mantener el orden del array, de la version mayor a menor
 * 
 * es un array de {[key: 'X.X.X' = "función con cambios a aplicar"]}
 * 
 * Para actualizaciones de DB revisar https://sequelize.org/docs/v6/other-topics/migrations/
 */
 const versions: [string, () => Promise<void>][] = [
    ['0.0.5', async () => {
        // no hacer nada
        let { Logger } = await import("@class/Logger.server.mjs")
        Logger.success("Versión 0.0.5 aplicada correctamente (simulacro de actualización)")
    }],
    ['0.0.4', async () => {
        // no hacer nada
        let { Logger } = await import("@class/Logger.server.mjs")
        Logger.success("Versión 0.0.4 aplicada correctamente (simulacro de actualización)")
    }],
    ['0.0.3', async () => {
        // no hacer nada
        // throw new Error('A propósito para testear')
        let { Logger } = await import("@class/Logger.server.mjs")
        Logger.success("Versión 0.0.3 aplicada correctamente (simulacro de actualización)")
    }]
]

export default versions