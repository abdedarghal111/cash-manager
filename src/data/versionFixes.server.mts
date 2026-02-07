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
    ['0.7.0', async () => {
        // Avisar que HTTPS_SERVER_ADDRESS pasó a ser SERVER_HOSTNAME
        let { Logger } = await import("@class/Logger.server.mjs")
        const { getGlobalDotEnvInstance } = await import('@class/DotEnvManager.server.mjs')
        let dotenv = await getGlobalDotEnvInstance()

        let oldVar = await dotenv.getVar('HTTPS_SERVER_ADDRESS')
        let newVar = await dotenv.getVar('SERVER_HOSTNAME')

        // revisar que el usuario ha eliminado la vieja variable
        if (oldVar !== '' && oldVar !== undefined) {
            throw new Error('FATAL: 0.7.0 - Fallo actualizando', {
                cause: `HTTPS_SERVER_ADDRESS está definido, se debe de borrar la variable de ${dotenv.envFilePath} para poder migrar.`
            })
        }

        // revisar que el usuario ha añadido una nueva variable
        if (newVar === '' || newVar === undefined) {
            throw new Error('FATAL: 0.7.0 - Fallo actualizando', {
                cause: `SERVER_HOSTNAME no está definido, se debe de añadir la variable a ${dotenv.envFilePath} para poder migrar.`
            })
        }

        Logger.success("Versión 0.7.0 actualizada correctamente")
    }],
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