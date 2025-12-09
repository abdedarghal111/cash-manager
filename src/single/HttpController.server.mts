import express, { NextFunction, Request, Response } from 'express'
import https from 'https'
import { SERVER_CRT_FILE_PATH, SERVER_KEY_FILE_PATH, TEST_SERVER_KEY_FILE_PATH, TEST_SERVER_CRT_FILE_PATH } from '@data/paths.mjs'
import { readFileSync, existsSync } from 'fs'
import helmet from 'helmet'
import bcrypt from "bcrypt"
import { User } from '@class/model/User.server.mjs'

// variables
let httpsEnabled = true
let PORT = 5432
if(process.argv.find(val => val === '--dev')){
  httpsEnabled = false
}

// Montar el servidor
let existsRealCerts = existsSync(SERVER_CRT_FILE_PATH) && existsSync(SERVER_KEY_FILE_PATH);

let app = express()
let httpsServer = https.createServer({
    key: existsRealCerts ? readFileSync(SERVER_KEY_FILE_PATH, 'utf-8') : readFileSync(TEST_SERVER_KEY_FILE_PATH, 'utf-8'),
    cert: existsRealCerts ? readFileSync(SERVER_CRT_FILE_PATH, 'utf-8') : readFileSync(TEST_SERVER_CRT_FILE_PATH, 'utf-8')
  }, app)

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

// permitir requests inseguras
app.use((req, res, next) => {
  // orígenes permitidos
  res.header('Access-Control-Allow-Origin', '*')

  // headers permitidos
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, username, password');
  
  // métodos permitidos
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  
  // 4. Permitir cookies/credenciales (IMPORTANTE para tu "amILogged")
  // res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  // res.header('Access-Control-Allow-Credentials', 'false');
  // guardar la información de options 24h
  res.header('Access-Control-Max-Age', '86400');

  if(req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

// habilitar parsear json
// CUIDADO: esto solo funciona si le llega un header Content-Type: application/json
app.use(express.json())

// manejo de errores
// si algo sale mal devolver error e imprimirlo también
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  return res.status(500).json({ message: 'Error interno del servidor' })
})

// los dos posibles routers
let publicRouter = express.Router()
let privateRouter = express.Router()

// middleware para el router privado
// recibe las credenciales vía header y verifica que sean credenciales correctas
privateRouter.use(async (req, res, next) => {
  // recoger variables
  let username = req.headers['username']
  let password = req.headers['password']

  // variable de control
  let pass = false

  // validar datos
  if (typeof username === 'string' && typeof password === 'string') {
    // encontrar usuario
    let user = await User.findOne({ where: { username: username } })
    // usuario y contraseña correctos
    if (user && bcrypt.compareSync(password, user.password)) {
      // guardar en locals
      // @ts-ignore
      req.locals = req.locals || {}
      // @ts-ignore
      req.locals.user = user
      pass = true
    }
  }

  // aceptar petición si es válida
  if (pass) {
    next()
  } else {
    return res.sendStatus(401)
  }
})

// clase controladora
let HttpsController = {

    express: app,
    server: httpsServer,

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
          console.log(`Servidor corriendo en https://localhost:${PORT}`);
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