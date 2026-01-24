/**
 * Implementación de JWT, Json Web Tokens
 * 
 * Aquí se crea el controlador que se encarga de dar el okey o rechazar el JWT y de crear las claves y manejarlas
 * 
 * TODO: También cuenta con una capa extra que tiene una blacklist de los tokens a denegar
 * TODO: Implementar anti-replay para evitar el reuso de tokens
 * 
 * Recursos consultados:
 *  - https://mojoauth.com/keypair-generation/generate-keypair-using-ed25519-with-javascript
 *  - https://medium.com/code-wave/how-to-make-your-own-jwt-c1a32b5c3898
 * 
 * Básicamente unos tokens autofirmados que constan de tres partes:
 * 
 * 1. Un header base64urlEnconde(header)
 *   - "alg": tipoAlgoritmo
 *   - "typ": "JWP"
 * 2. Un Payload base64urlEnconde(payload)
 *   - "id": idDelUsuario
 *   - "exp": "tiempo de expiración"
 * 3. Signature / firma HMAC_ALGORITMO(secret, base64urlEnconde(header) + "." + base64urlEnconde(payload))
 */
// import { DotEnvManager } from "@class/DotEnvManager.server.mjs"
import { JWT_PRIVATE_KEY_FILE_PATH, JWT_PUBLIC_KEY_FILE_PATH } from "@data/paths.mjs"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname } from "path"
import { ReceivedCookie, SendCookie } from "@single/CookieParser.mts"
import { Validator } from "@single/Validator.mts"
import { Logger } from "@class/Logger.server.mjs"

// que la cookie dure máximo 2 semana (miliseg * seg * min * hora * día * semana)
const MAX_DURATION_COOKIE = 1 * 1000 * 60 * 60 * 24 * 7 * 2
// renovar cuando quede el 20% del tiempo total
const RENEW_ON_REMAINING = 0.50 * MAX_DURATION_COOKIE

export class JWTController {

    // path a los archivos de las claves
    private publicKeyPath = ''
    private privateKeyPath = ''
    private publicKey = ''
    private privateKey = ''
    private publicCyptoKey: CryptoKey|null = null
    private privateCyptoKey: CryptoKey|null = null
    private JWTheader: {
        'alg': string,
        'typ': string
    }
    private JWTheader64url = ''
    private JWTheaderStr = ''

     /**
      * Preparar el controlador
      */
     constructor(publicKeyPath = JWT_PUBLIC_KEY_FILE_PATH, privateKeyPath = JWT_PRIVATE_KEY_FILE_PATH) {
        this.publicKeyPath = publicKeyPath
        this.privateKeyPath = privateKeyPath
        // algoritmo por ahora solo se gestiona uno
        this.JWTheader = {
            'alg': 'EdDSA',
            'typ': 'JWT'
        }
         this.JWTheaderStr = JSON.stringify(this.JWTheader)
         this.JWTheader64url = Buffer.from(this.JWTheaderStr).toString('base64url')
    }

    /**
     * Inicializa el controlador
     */
    public async init() {
        Logger.info(`Inicializando Controlador de JSON web tokens...`)

        // revisar si existen los dos certificados
        let missingFiles = 0
        let existsPublicKey = existsSync(this.publicKeyPath)
        if (!existsPublicKey) {
            missingFiles += 1
        }
        let existsPrivateKey = existsSync(this.privateKeyPath)
        if (!existsPrivateKey) {
            missingFiles += 1
        }

        if (missingFiles === 1) {
            // mandar error porque solo hay un certificado y o existen los dos o no existen los dos
            throw new Error('FATAL: Falta un certificado de sesión', {
                cause: `Falta el certificado ${existsPublicKey ? 'privado' : 'publico'} en el path: "${existsPublicKey ? this.privateKeyPath : this.publicKeyPath}"`
            })
        }

        if (missingFiles === 2) {
            // crear nuevas claves
            const { publicKey: generatedPublic, privateKey: generatedPrivate } = await crypto.subtle.generateKey(
                {
                    name: 'Ed25519',
                    // namedCurve normalmente es redundante para Ed25519 pero es buena práctica
                    namedCurve: 'Ed25519',
                },
                true, // Que se pueda extraer la key
                ['sign', 'verify'] // Usos que se le dará
            )

            // exportarlas y guardarlas
            // https://nodejs.org/api/webcrypto.html#subtleexportkeyformat-key
            const publicKeyJwkObject = await crypto.subtle.exportKey("jwk", generatedPublic)
            const privateKeyPkcs8Buffer = await crypto.subtle.exportKey("pkcs8", generatedPrivate)

            this.publicKey = JSON.stringify(publicKeyJwkObject)
            this.privateKey = Buffer.from(privateKeyPkcs8Buffer).toString('base64')
            
            // crear carpeta si no existe
            mkdirSync(dirname(this.privateKeyPath), { recursive: true })
             mkdirSync(dirname(this.publicKeyPath), { recursive: true })

            // crear ficheros
            writeFileSync(this.privateKeyPath, this.privateKey, { encoding: 'utf-8' })
            writeFileSync(this.publicKeyPath, this.publicKey, { encoding: 'utf-8' })

            Logger.success(`Claves generadas y guardadas`, 2)
        } else {
            // cargar las claves a las variables
            this.publicKey = readFileSync(this.publicKeyPath, 'utf-8')
            this.privateKey = readFileSync(this.privateKeyPath, 'utf-8')
        }

        // cargar claves
        this.publicCyptoKey = await crypto.subtle.importKey(
            'jwk',
            JSON.parse(this.publicKey),
            {
                name: 'Ed25519',
                namedCurve: 'Ed25519',
            },
            true,
            ['verify']
        )
        this.privateCyptoKey = await crypto.subtle.importKey(
            'pkcs8',
             Buffer.from(this.privateKey, 'base64'),
            {
                name: 'Ed25519',
                namedCurve: 'Ed25519',
            },
            true,
            ['sign']
        )
        Logger.success(`Claves cargadas correctamente`, 2)
    }

    /**
     * Verifica si la cookie es válida o no
     * 
     * @returns un resumen con si es válida y si necesita ser renovada la cookie
     */
    async isValidSession(JWTcookie: ReceivedCookie): Promise<{ isValid: boolean, outdated: boolean, needRenew: boolean, userId: number }> {
        let resume = {
            isValid: false,
            outdated: false,
            needRenew: false,
            userId: 0
        }
        
        // separar strings
        let parts = JWTcookie.value.split('.')
        if (parts.length !== 3) {
            return resume
        }

        // rescatar partes en base64url (JWT standard)
        let header64url = parts[0]!
        let payload64url = parts[1]!
        let signature64url = parts[2]!

        // si no es el mismo header entonces volver
        if (this.JWTheader64url !== header64url) {
            return resume
        }
        
        // verificar la firma: comprobar si firma === firma(header.payload)
        let validSignature = await crypto.subtle.verify(
            'Ed25519',
            this.publicCyptoKey!,
            Buffer.from(signature64url, 'base64url'),
            Buffer.from(`${header64url}.${payload64url}`)
        )
        
        if (!validSignature) {
            return resume
        }

        // verificar si no ha caducado
        let { validPayload, userId, expiration } = this.extractUserId(JWTcookie)

        if (!validPayload) {
            return resume
        }


        // entonces es un certificado válido (pendiente de probar si está caducado)
        resume.isValid = true
        resume.userId = userId

        /**
         * Sería visto como algo así
         * 
         *              ==> tiempo desde 1970 ===>
         * Current:     --------------------------
         * Expiration:  ----------------
         * Time diff:                   ----------
         * 
         * Si timeDiff es positivo entonces ha caducado
         */
        let timeDiff = new Date().getTime() - expiration
        if (timeDiff > 0) {
            resume.outdated = true
            return resume
        }

        // comprobar si está cerca de caducar (si la diferencia es menor que el máximo para renovar)
        timeDiff = Math.abs(timeDiff)
        if (timeDiff < RENEW_ON_REMAINING) {
            resume.needRenew = true
        }

        return resume
    }

    /**
     * Escribe una nueva sesión en la cookie de un usuario y el id asignado
     * 
     * @param userId el id de usuario a guardar
     * @param duration la duración de la sesión en milisegundos
     * @param cookie La cookie en la que escribir la sesión 
     */
    async newSessionToCookie(userId: number, cookie: SendCookie, duration = MAX_DURATION_COOKIE) {
        // crear payload de JWT
        let payload = JSON.stringify({
            userId: userId,
            expiration: Date.now() + duration
        })
        
        let payload64url = Buffer.from(payload).toString('base64url')
        
        // firmar el payload con la clave privada y obtener la firma en base64
        let signBuffer = await crypto.subtle.sign(
            'Ed25519', 
            this.privateCyptoKey!, 
            Buffer.from(`${this.JWTheader64url}.${payload64url}`)
        )
        
        let signatureBase64url = Buffer.from(signBuffer).toString('base64url')

        // crear el token final (JWT standard uses base64url for all parts)
        let JWTtoken = `${this.JWTheader64url}.${payload64url}.${signatureBase64url}`

        // establecer la cookie con el token (base64url is URL-safe, but keep encodeURIComponent for safety)
        cookie.value = encodeURIComponent(JWTtoken)

        // retornar la cookie
        return cookie
    }

    /**
     * Devuelve el userId de la sesión si es válido o null si no lo es
     */
    extractUserId(JWTcookie: ReceivedCookie): { validPayload: boolean, userId: number, expiration: number } {
        let resume = {
            validPayload: false,
            userId: 0,
            expiration: 0
        }

        // extraer la payload
        let parts = JWTcookie.value.split('.')
        let payloadBase64url = parts.at(1)

        if (payloadBase64url === undefined) {
            return resume
        }

        // de base64url a texto (JWT uses base64url)
        let payload = Buffer.from(payloadBase64url, 'base64url').toString('utf-8')

        let contents

        try {
            contents = JSON.parse(payload)
        } catch {
            // no se pudo leer bien
            return resume
        }

        // verificar que tenga el userId y la fecha de expiración
        if (contents.userId === undefined || contents.expiration === undefined) {
            return resume
        }

        // verificar que sean números
        let userId = Validator.parseInt(contents.userId)
        let expiration = Validator.parseInt(contents.expiration)

        if (Validator.isNotValid(userId) || Validator.isNotValid(expiration)) {
            return resume
        }

        resume.validPayload = true
        resume.userId = userId
        resume.expiration = expiration

        return resume
    }

    // /**
    //  * recibe la sesión de cookie y devuelve si está todo correcto
    //  */
    // async verifySignature(jwt: object) {
    //     const messageBuffer = new TextEncoder().encode(message)
    //     const signature = await crypto.subtle.sign('Ed25519', this.privateCyptoKey!, messageBuffer)
    //     const isValid = await crypto.subtle.verify('Ed25519', this.publicCyptoKey!, signature, messageBuffer)
    // }
}