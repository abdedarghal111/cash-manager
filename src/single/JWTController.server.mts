/**
 * Implementación de JWT, Json Web Tokens
 * 
 * Aquí se crea el controlador que se encarga de dar el okey o rechazar el JWT y de crear las claves y manejarlas
 * 
 * También cuenta con una capa extra que tiene una blacklist de los tokens a denegar
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
    private JWTheader64 = ''
    private JWTheaderStr = ''
    // private envManager = new DotEnvManager()

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
        this.JWTheader64 = Buffer.from(this.JWTheaderStr).toString('base64')
    }

    /**
     * Inicializa el controlador
     */
    public async init() {
        // revisar si existen los dos certificados
        let missingFiles = 0
        let existsPrivateKey = existsSync(this.publicKeyPath)
        if (!existsPrivateKey) {
            missingFiles += 1
        }
        let existsPublicKey = existsSync(this.privateKeyPath)
        if (!existsPublicKey) {
            missingFiles += 1
        }

        if (missingFiles === 1) {
            // mandar error porque solo hay un certificado y o existen los dos o no existen los dos
            throw new Error('FATAL: Falta un certificado de sesión', {
                cause: `Falta el certificado ${existsPrivateKey ? 'publico' : 'privado'} en el path: "${existsPrivateKey ? this.publicKeyPath : this.privateKeyPath}"`
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
            this.privateKey = Buffer.from(privateKeyPkcs8Buffer).toString()
            
            // crear carpeta si no existe
            mkdirSync(dirname(this.privateKeyPath), { recursive: true })
            mkdirSync(dirname(this.publicKey), { recursive: true })

            // crear ficheros
            writeFileSync(this.privateKeyPath, this.privateKey, { encoding: 'utf-8' })
            writeFileSync(this.publicKeyPath, this.publicKey, { encoding: 'utf-8' })
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
            Buffer.from(this.privateKey, 'utf-8'),
            {
                name: 'Ed25519',
                namedCurve: 'Ed25519',
            },
            true,
            ['sign']
        )
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

        // rescatar partes en base64
        let header64 = parts[0]!
        let payload64 = parts[1]!
        let signature64 = parts[2]!

        // si no es el mismo header entonces volver
        if (this.JWTheader64 !== header64) {
            return resume
        }
        
        // convertir a texto
        // let signature = Buffer.from(signature64, 'base64').toString('utf-8')
        
        // convertir a base 64
        let header = Buffer.from(header64, 'base64').toString('utf-8')
        let payload = Buffer.from(payload64, 'base64').toString('utf-8')
        
        // verificar la firma: comprobar si firma === firma(header.payload)
        let validSignature = await crypto.subtle.verify(
            'Ed25519',
            this.publicCyptoKey!,
            Buffer.from(signature64, 'base64'),
            Buffer.from(`${header64}.${payload64}`)
        )
        
        if (!validSignature) {
            parts.forEach((a) => console.log(Buffer.from(a,'base64').toString('utf-8')))
            console.log("no es válido")
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
        
        let payload64 = Buffer.from(payload).toString('base64')
        
        // firmar el payload con la clave privada y obtener la firma en base64
        let signBuffer = await crypto.subtle.sign(
            'Ed25519', 
            this.privateCyptoKey!, 
            Buffer.from(`${this.JWTheader64}.${payload64}`)
        )
        
        let signatureBase64 = Buffer.from(signBuffer).toString('base64')

        // crear el token final
        let JWTtoken = `${this.JWTheader64}.${payload64}.${signatureBase64}`

        // establecer la cookie con el token
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
        let payload = parts.at(1)

        if (payload === undefined) {
            return resume
        }

        // de base64 a texto
        payload = Buffer.from(payload, 'base64').toString('utf-8')

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