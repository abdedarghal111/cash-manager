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

    const { getGlobalDotEnvInstance } = await import('@class/DotEnvManager.server.mjs')
    await getGlobalDotEnvInstance()

    const { DatabaseController } = await import('@single/DatabaseController.server.mjs')
    await DatabaseController.sync()

    const { HttpsController } = await import('@single/HttpController.server.mjs')
    await HttpsController.startServer()

    Logger.info('Iniciando endpoints...')

    // cargar routers del servidor (los privados tienen middleware de login)
    HttpsController.addPrivateRouter((await import('@routes/private/amILogged/index.server.mjs')).default)
    HttpsController.addPublicRouter((await import('@routes/public/register/index.server.mjs')).default)
    HttpsController.addPublicRouter((await import('@routes/public/login/index.server.mjs')).default)
    HttpsController.addPrivateRouter((await import('@routes/private/cuentas/index.server.mjs')).default)
    HttpsController.addPrivateRouter((await import('@routes/private/expenses/index.server.mjs')).default)
    HttpsController.addPrivateRouter((await import('@routes/private/estadisticas/index.server.mjs')).default)
    HttpsController.addPrivateRouter((await import('@routes/private/ingresarMonto/index.server.mjs')).default)
    HttpsController.addPrivateRouter((await import('@routes/private/balances/index.server.mjs')).default)

    Logger.success('Endpoints desplegados', 2)

    Logger.success(`Servidor Desplegado!`)
} catch (error) {
    // si algo va mal, mostrar el error
    if (error instanceof Error) {
        Logger.logError(error)
    } else {
        Logger.error(error as string)
    }

    Logger.warn('El servidor no pudo arrancar, lee el error y soluciona el problema.')
    process.exit(1)
}