/**
 * Fichero principal del servidor
 * 
 * Básicamente inicializará la base de datos y el servidor http.
 * 
 * Aquí se importarán todos los routers de la api también.
 * 
 * A partir de public routers y routers privados
 */
import dotenv from 'dotenv'
import { ENV_FILE_PATH } from '@data/paths.mjs'
import { DatabaseController } from '@single/DatabaseController.server.mjs'
import HttpsController from '@single/HttpController.server.mjs'
import amILoggedRouter from '@routes/private/amILogged/index.server.mjs'
import registerRouter from '@routes/public/register/index.server.mjs'
import cuentasRouter from '@routes/private/cuentas/index.server.mjs'

// cargando variables de entorno
dotenv.config({ path: ENV_FILE_PATH })

// inicializando base de datos
await DatabaseController.sync()

// cargar routers del servidor (los privados tienen middleware de login)
HttpsController.addPrivateRouter(amILoggedRouter)
HttpsController.addPublicRouter(registerRouter)
HttpsController.addPrivateRouter(cuentasRouter)

// iniciar el servidor https
HttpsController.startServer()