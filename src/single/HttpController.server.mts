/**
 * Controlador de la entrada HTTPS y todo lo que tenga que ver con hacer las requests
 * 
 * La seguridad (del medio de transporte HTTP)
 * Los middleware de seguridad y todo eso se controla aquí, en el lado del cliente se usa RequestsManager
 * 
 * @see /src/single/Requests.client.mts
 */ 
import express, { NextFunction, Request, Response } from 'express'
import https from 'https'
import { readFileSync, existsSync } from 'fs'
import helmet from 'helmet'
import { User } from '@class/model/User.server.mjs'
import { 
  SERVER_CRT_FILE_PATH,
  SERVER_KEY_FILE_PATH,
  TEST_SERVER_KEY_FILE_PATH,
  TEST_SERVER_CRT_FILE_PATH
} from '@data/paths.mjs'
import { CookieParser } from '@single/CookieParser.mts'
import { JWTController } from '@single/JWTController.server.mts'

// declaración global de las propiedades para el tipado fuerte
declare global {
  namespace Express {
    interface Request {
      locals: {
        absoluteUrl: string // la url completa a la que se hace la request
        host: string // host ejemplo 127.0.0.1 o www.tal.es
        cookiesManager: CookieParser // el cookies parser después del middleware también
        user: User // el usuario después de pasar el middleware
      },
    }
  }
}

// variables
let PORT = 5432

// Montar el servidor
let existsRealCerts = existsSync(SERVER_CRT_FILE_PATH) && existsSync(SERVER_KEY_FILE_PATH)

// TODO: integrar generar certificados aleatorios si no existen reales: https://mojoauth.com/keypair-generation/generate-keypair-using-ed25519-with-expressjs
let app = express()
let httpsServer = https.createServer(
  {
    key: existsRealCerts ? readFileSync(SERVER_KEY_FILE_PATH, 'utf-8') : readFileSync(TEST_SERVER_KEY_FILE_PATH, 'utf-8'),
    cert: existsRealCerts ? readFileSync(SERVER_CRT_FILE_PATH, 'utf-8') : readFileSync(TEST_SERVER_CRT_FILE_PATH, 'utf-8')
  }, app
)

// medidas de seguridad
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
)

/**
 * Aquí el middleware que recibe absolutamente todas las peticiones y separa public y private
 * 
 * Se organiza como se observa en:
 * 
 * 1. Enviar los headers
 * 2. Respuesta a las "options"
 * 3. leer las cookies y guardar
 * 4. El middleware private maneja las credenciales
 */
app.use((req, res, next) => {
  // orígenes permitidos: para permitir que el solicitante guarde cookies (lo mismo que poner *)
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  // para decirle al solicitante que las cookies están permitidas
  res.header('Access-Control-Allow-Credentials', 'true')

  // headers permitidos
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept')
  
  // métodos permitidos
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  
  // guardar la información de options 24h
  res.header('Access-Control-Max-Age', '86400')

  // responder al método options
  if(req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  // construir locals 
  // @ts-ignore
  req.locals = {}

  // leer las cookies recibidas por el usuario
  req.locals.cookiesManager = new CookieParser(req.headers.cookie)

  // url solicitada ejemplo: https://localhost:1234/miendpoint
  req.locals.absoluteUrl = req.protocol + '://' + req.get('host') + req.originalUrl

  // el host sin el puerto
  req.locals.host = req.get('host')!.split(':').at(0)! ?? ''

  // pasar al siguiente middleware
  next()
})

// habilitar parsear json
// CUIDADO: esto solo funciona si le llega un header Content-Type: application/json
app.use(express.json())

// inicializar JWTController para manejar las credenciales
const jwtController = new JWTController()
await jwtController.init()

// manejo de errores sincronos (por ahora todavía ni me ha tocado un error ni ha funcionado)
// si algo sale mal devolver error e imprimirlo también
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // si no es un error entonces pasar al siguiente
  if(!(err instanceof Error)) {
    return next(err)
  }

  console.error("-------------- SYNC ERROR --------------")
  console.error(
    `- Name: ${err.name}\n` +
    `- Message: ${err.message}\n` +
    `- Cause: ${err.cause}\n` +
    `- Stack: ${err.stack}\n`
  )
  console.error("-------------- END ERROR --------------")
  // añadir cabecera 500 y pasar al siguiente
  res.status(500).json({ message: 'Error interno del servidor' })
  return next(err)
})

// manejo de errores asincronos:
// actua como un wrapper en cada endpoint de cada middleware
export const asyncErrorHandler = (func: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
  func(req, res, next).catch((err: Error) => {
    console.error("-------------- ASYNC ERROR --------------")
    console.error(
      `- Name: ${err.name}\n` +
      `- Message: ${err.message}\n` +
      `- Cause: ${err.cause}\n` +
      `- Stack: ${err.stack}\n`
    )
    console.error("-------------- END ERROR --------------")
    // añadir cabecera 500 y pasar al siguiente
    res.status(500).json({ message: 'Error interno del servidor' })
    next()
  })
}

// los dos posibles routers
let publicRouter = express.Router()
let privateRouter = express.Router()

// middleware para el router privado, valida el token jwt y pasa si está todo ok
privateRouter.use(asyncErrorHandler(async (req, res, next) => {
  // TODO: añadir un rate limiter para prevenir solicitudes abusivas

  // recoger cookie de usuario
  let JWTCookie = req.locals.cookiesManager.get("passport")

  // sesión inválida si no existe o no es válida
  if (!JWTCookie) {
    return res.sendStatus(401)
  }
  
  // recibir resumen de la sesión
  let { isValid: validJWT, outdated: outdatedJWT, needRenew, userId } = await jwtController.isValidSession(JWTCookie)
  
  // si no es válida entonces devolver
  if (!validJWT) {
    return res.sendStatus(401)
  }
  
  // si está caducada entonces borrarla
  if (outdatedJWT) {
    let responseCookie = JWTCookie.toSendCookie()
    responseCookie.setAsSecure(req.locals.host)
    responseCookie.setAsDeleted()
    return res.sendStatus(403).header('Set-Cookie', responseCookie.toString())
  }

  // si necesita ser renovada (cerca de caducar)
  if (needRenew) {
    let renewedJWTCookie = JWTCookie.toSendCookie()
    await jwtController.newSessionToCookie(userId, renewedJWTCookie)
    renewedJWTCookie.setAsSecure(req.locals.host)
    renewedJWTCookie.setMaxAge('D', 14)
    // añadir header a la respuesta
    res.header('Set-Cookie', renewedJWTCookie.toString())
  }

  // buscar usuario
  let user = await User.findByPk(userId)
  
  if (!user) {
    // cookie inválida, borrarla
    let responseCookie = JWTCookie.toSendCookie()
    responseCookie.setAsSecure(req.locals.host)
    responseCookie.setAsDeleted()
    return res.sendStatus(403).header('Set-Cookie', responseCookie.toString())
  }
  
  req.locals.user = user

  // es válido, siguiente middleware
  next()
}))

// clase controladora
let HttpsController = {

    express: app,
    server: httpsServer,
    jwtController: jwtController,

    /**
     * Indica si se usan certificados reales o solo los de prueba en caso de false
     */
    secure: existsRealCerts,

    /**
     * Inicia el servidor
     */
    startServer: () => {
        // Iniciar el servidor
        app.use(publicRouter)
        app.use(privateRouter)

        httpsServer.listen(PORT, () => {
          //listening in my ip
          console.log(`Servidor corriendo en https://localhost:${PORT}`)
        })
    },

    /**
     * Agrega un router a la parte pública de la api
     * 
     * @param {express.Router} router
     */
    addPublicRouter: (router: express.Router) => {
      publicRouter.use(router)
    },

    /**
     * Agrega un router a la parte privada de la api
     * 
     * @param {express.Router} router
     */
    addPrivateRouter: (router: express.Router) => {
      privateRouter.use(router)
    }
}

export default HttpsController