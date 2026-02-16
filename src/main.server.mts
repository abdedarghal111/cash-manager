/**
 * Fichero principal del servidor que inicializa las cosas en orden
 * 
 * Básicamente inicializará la base de datos y el servidor http.
 * 
 * Aquí se importarán todos los routers de la api también.
 * 
 * A partir de public routers y routers privados
 */
const { Logger } = await import('@class/Logger.server.mjs')

Logger.info(`Arrancando el servidor`)

// intentar arrancar:
try {
    // sobreescribir funciones de console.log/warn/error para que se vean como logs
    Logger.alterConsoleFunctions()

    const { ServerConfig } = await import('@single/ServerConfig.server.mjs')
    ServerConfig.init()

    const { VersionController } = await import('@single/VersionController.server.mjs')
    let updateState = await VersionController.checkAndApplyVersions()

    if (updateState === 'errored') {
        process.exit(1)
    }
    // TODO: implementar lógica para denegar peticiones con otra versión
    // TODO: implementar obtener certificado de let's encrypt automáticamente

    const { getGlobalDotEnvInstance } = await import('@class/DotEnvManager.server.mjs')
    let dotenv = await getGlobalDotEnvInstance()

    const { LetsEnctryptACMEClient } = await import('@single/LetsEnctryptACMEClient.server.mjs')
    // revisar certificados y realizar peticiones ACME a letsencrypt si es necesario
    await LetsEnctryptACMEClient.checkCertificate()

    const { DatabaseController } = await import('@single/DatabaseController.server.mjs')
    // mostrar logs solo si está permitido
    await DatabaseController.updateShowLogsFromEnvVar()
    // ya no es necesario sincronizar, hay que hacerlo vía updates @see src\data\versionFixes.server.mts
    if (updateState === 'newInstall') {
        await DatabaseController.sync()
    }

    const { HttpController } = await import('@single/HttpController.server.mjs')
    await HttpController.startServer()

    Logger.info('Añadiendo endpoints...')

    // cargar routers del servidor (los privados tienen middleware de login)
    HttpController.addPrivateRouter((await import('@routes/private/amILogged/index.server.mjs')).default)
    HttpController.addPublicRouter((await import('@routes/public/register/index.server.mjs')).default)
    HttpController.addPublicRouter((await import('@routes/public/login/index.server.mjs')).default)
    HttpController.addPrivateRouter((await import('@routes/private/cuentas/index.server.mjs')).default)
    HttpController.addPrivateRouter((await import('@routes/private/expenses/index.server.mjs')).default)
    HttpController.addPrivateRouter((await import('@routes/private/estadisticas/index.server.mjs')).default)
    HttpController.addPrivateRouter((await import('@routes/private/ingresarMonto/index.server.mjs')).default)
    HttpController.addPrivateRouter((await import('@routes/private/balances/index.server.mjs')).default)
    HttpController.addPrivateRouter((await import('@routes/private/extraccion/index.server.mjs')).default)

    Logger.success('Endpoints desplegados', 2)

    Logger.success(`Servidor Desplegado!`)
} catch (error) {
    // si algo va mal, mostrar el error
    if (error instanceof Error) {
        Logger.logError(error)
    } else {
        Logger.error(error as string)
    }

    Logger.warn('El servidor no pudo arrancar, lee el error y soluciona el problema antes de volver a ejecutar.')
    process.exit(1)
}