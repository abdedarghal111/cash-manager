/**
 * Módulo que se encarga de revisar si tienes los certificados HTTPS y si no pues pide un certificado a Let's Encrypt
 * 
 * Funciona empleando el protocolo ACME
 */
import { getGlobalDotEnvInstance } from '@class/DotEnvManager.server.mjs'
import { Logger } from '@class/Logger.server.mjs'
import { SERVER_CRT_FILE_PATH, SERVER_KEY_FILE_PATH } from '@data/paths.mjs'
import crypto from 'crypto'
import express from 'express'
import http from 'http'
import https from 'https'
import axios from 'axios'
import forge from 'node-forge'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { ServerConfig } from './ServerConfig.server.mts'

// SOLO para testing
const USE_INSECURE_AND_TESTING_MODE = false
if (USE_INSECURE_AND_TESTING_MODE) {
    // la siguiente linea solo para testing (es necesaria):
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
}
// para aceptar requests inseguras para TESTING si se está testeando
let userAgentToUse = USE_INSECURE_AND_TESTING_MODE ? new https.Agent({ rejectUnauthorized: false }) : undefined
let ACMEDirUrl = USE_INSECURE_AND_TESTING_MODE ?  'https://0.0.0.0:14000/dir' : 'https://acme-v02.api.letsencrypt.org/directory'
// 'https://acme-staging-v02.api.letsencrypt.org' // lets encrypt stagging

export const LetsEnctryptACMEClient = {
    /**
     * Revisa los certificados actuales y pide un nuevo certificado
     * usando el protocolo ACME a Let's Encrypt usando el nombre de dominio
     * asignado en las variables de entorno.
     */
    checkCertificate: async () => {
        // antes que nada revisar si está configurado para usar el cliente ACME
        let dotenv = await getGlobalDotEnvInstance()
        if (!(await dotenv.getBoolean('USE_ACME_CLIENT'))) {
            Logger.log('El cliente de ACME está marcado como desactivado (en el .env).', 1)
            return
        }

        Logger.warn('Inciando cliente ACME', 1)

        // revisar caducidad de certificado actual
        Logger.log('Revisando certificados actuales', 1)
        if (isActualCertValid()) {
            Logger.success('Existen certificados todavía vigentes.', 2)
            return true
        }

        // si está caducado o no existe entonces comenzar el protocolo de obtener el certificado nuevo
        let dominio = await dotenv.getString('SERVER_HOSTNAME')
        dominio = dominio.toLowerCase() // para que sea identico sin confusiones
        Logger.warn('No se han encontrado certificados válidos, realizando nueva petición de certificado a Let\'s Encrypt.', 2)
        Logger.info(`Se usará el dominio de "${dominio}" para la obtención del certificado.`, 3)

        // inicializar servidor temporal
        // tiene que ser http porque el protocolo ACME lo requiere
        let app = express()
        let port = await dotenv.getInt('HTTP_SERVER_PORT', true)
        let httpServer = http.createServer(app).listen(port)

        // proceder al protocolo por defecto si no es una petición exitosa, salta error


        /**
         * Primero GET a /dir, devuelve la lista con todas las url's de interés
         * 
         * Así saber a donde hacer las peticiones
         */
        Logger.log("Obteniendo url's del servidor ACME", 2)
        let dirResult = await axios.get(ACMEDirUrl, {
            httpsAgent: userAgentToUse
        })
        // // debug
        // Logger.info('Dir request')
        // console.log(dirResult.status)
        // // @ts-ignore
        // console.log(dirResult.headers.toJSON())
        // console.log(dirResult.data)
        // let keyChangeURL = String(dirResult.data["keyChange"])
        // let renewalInfoURL = String(dirResult.data["renewalInfo"])
        // let revokeCertURL = String(dirResult.data["revokeCert"])
        let newAccountURL = String(dirResult.data["newAccount"])
        let newNonceURL = String(dirResult.data["newNonce"])
        let newOrderURL = String(dirResult.data["newOrder"])
        Logger.info('Se obtuvo la lista de URLs del servidor ACME.', 3)



        /**
         * Segundo GET/HEAD a /new-nonce, devuelve un Replay-Nonce
         * 
         * De esta manera tenemos el token necesario para las demás peticiones
         */
        Logger.log("Obteniendo nonce del servidor ACME", 2)
        let newNonceResult = await axios.get(newNonceURL, {
            httpsAgent: userAgentToUse
        })
        let replayNonce = newNonceResult.headers['replay-nonce']
        Logger.info('Se obtuvo un nonce del servidor ACME.', 3)
        // // debug new nonce
        // Logger.info('New nonce request')
        // console.log(newNonceResult.status)
        // // @ts-ignore
        // console.log(newNonceResult.headers.toJSON())
        // console.log(newNonceResult.data)



        /**
         * Tercero POST a newAccount 
         * - Se envía un post con "termsOfServiceAgreed" y "contact" con los emails. Se envía firmado a modo de JSON Web Token
         * - Devuelve un nuevo nonce y la url de la cuenta
         * 
         * Aquí ya tenemos que crear un par de claves para la cuenta y así usarlas
         * Y también firmar las peticiones
         */
        Logger.log("Creando nueva cuenta en el servidor ACME", 2)
        let { publicKey: accPubKey, privateKey: accPriKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
        // Logger.info('New account request')
        let newAccountResult = await makeJOSEPostRequest(
            newAccountURL,
            {
                "termsOfServiceAgreed": true,
                "contact": []
            },
            replayNonce,
            accPriKey,
            undefined,
            accPubKey
        )
        let accountUrl = newAccountResult.headers['location']
        replayNonce = newAccountResult.headers['replay-nonce']
        Logger.success("Cuenta creada exitosamente en el servidor ACME", 3)
        


        /**
         * Cuarto POST a newOrder
         * - Se envía un post con "identifiers" y dentro los dominios. Se envía firmado a modo de JSON Web Token
         * - Devuelve un nuevo nonce y la url de la cuenta
         * https://datatracker.ietf.org/doc/html/rfc8555#section-7.4
         */
        Logger.log("Creando nueva orden para el dominio", 2)
        // Logger.info('New order request')
        let newOrderResult = await makeJOSEPostRequest(
            newOrderURL,
            {
                "identifiers": [
                    { "type": "dns", "value": dominio }
                ],
            },
            replayNonce,
            accPriKey,
            accountUrl
        )
        let orderUrl = newOrderResult.headers['location']
        let finalizeUrl = newOrderResult.data['finalize']
        let authorizations = newOrderResult.data['authorizations']
        replayNonce = newOrderResult.headers['replay-nonce']
        Logger.info("Orden creada exitosamente en el servidor ACME", 3)
        


        /**
         * Quinto POST a la url de authorizations (los challenges)
         * - Se envía un post vacío. Se envía firmado a modo de JSON Web Token
         * - Devuelve un nuevo nonce y las url y informaciones de todos los challenges a cumplir
         */
        Logger.log("Obteniendo detalles de los desafíos para el dominio", 2)
        let challengesResult = await makeJOSEPostRequest(
            authorizations[0],
            '',
            replayNonce,
            accPriKey,
            accountUrl
        )

        replayNonce = challengesResult.headers['replay-nonce']
        let challenges = challengesResult.data['challenges']
        
        // // debug
        // Logger.info('New challenge request')
        // console.log(challengesResult.status)
        // // @ts-ignore
        // console.log(challengesResult.headers.toJSON())
        // console.log(challengesResult.data)
        
        // buscar el challenge http-01
        let httpChallenge = challenges.find((challenge: any) => challenge.type === 'http-01')
        if (!httpChallenge) {
            throw Error('FATAL: ACME challenge error', {
                cause: 'No se ha encontrado un challenge de tipo "http-01" en la respuesta del servidor.'
            })
        }
        Logger.info("Detalles de los desafíos obtenidos", 3)

        Logger.log("Preparandose para cumplir el desafío http-01", 2)
        // Se necesita calcular el "key authorization"
        // keyAuthorization = token + "." + base64url(JWK_Thumbprint(accountKey))
        const keyAuthorization = getKeyAuthorization(httpChallenge.token, accPubKey)

        /**
         * ahora se prepara la url para recibir el challenge http
         */
        app.get('/.well-known/acme-challenge/:token', (req, res) => {
            // Si el token coincide, devuelve la Key Authorization calculada
            res.header('Content-Type', 'text/plain').send(keyAuthorization)
        })

        

        /**
         * Sexto POST a la url del challenge http-01 para notificar de que estas listo
         * - Se envía un post vacío ({}). Se envía firmado a modo de JSON Web Token
         * - Devuelve un nuevo nonce y el estado de la petición
        */
        // Logger.info('Am ready request')
        Logger.info("Servidor listo, avisando de que está listo.", 2)
        let amReadyResult = await makeJOSEPostRequest(
            httpChallenge['url'],
            {},
            replayNonce,
            accPriKey,
            accountUrl
        )

        replayNonce = amReadyResult.headers['replay-nonce']
        Logger.info("Aviso enviado, sondeo de 2 segundos para comprobar el estado de la petición.", 3)



        /**
         * Septimo POST a la url de httpChallenge para ver el estado del challenge
         * - Se envía un post vacío. Se envía firmado a modo de JSON Web Token
         * - Devuelve un nuevo nonce y el estado de la petición
         * 
         * En general es un sondeo para ver si lo recibe o no
         */
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2 * 1000))
            // Logger.info('Check challenge request')
            Logger.log("Revisando estado del desafío http-01", 2)
            let challengeStatusResult = await makeJOSEPostRequest(
                httpChallenge['url'],
                '',
                replayNonce,
                accPriKey,
                accountUrl
            )

            replayNonce = challengeStatusResult.headers['replay-nonce']
            let status = challengeStatusResult.data['status']

            if (status === 'valid') {
                // success!!
                Logger.success("Desafío http-01 completado con éxito.", 3)
                break
            }

            if (status === 'processing') {
                Logger.log("Desafío en proceso, repitiendo sondeo...", 3)
                continue
            }

            if (status === 'invalid') {
                throw new Error('FATAL: Error en la validación del desafío.', {
                    cause: 'Por alguna razón no se ha podido validar el dominio, prueba a revisar que el servidor es accesible desde fuera.'
                })
            }
        }



        /**
         * octavo POST a la url de order sin nada y esperar a que devuelva true
         * - Se envía un post vacío. Se envía firmado a modo de JSON Web Token
         * - Devuelve nonce y el estado de la petición o el certificado pem
         */
        Logger.info("Sondeo de 2 segundos para comprobar el estado de la orden.", 2)
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2 * 1000))
            // Logger.info('Check certificate request')
            Logger.log("Revisando estado de la orden para obtener el certificado.", 2)
            let challengeStatusResult = await makeJOSEPostRequest(
                orderUrl,
                '',
                replayNonce,
                accPriKey,
                accountUrl
            )

            replayNonce = challengeStatusResult.headers['replay-nonce']
            let status = challengeStatusResult.data['status']

            if (status === 'ready') {
                Logger.success("Orden lista para obtener el certificado.", 3)
                break
            }

            if (status === 'processing') {
                Logger.log("Orden en proceso, repitiendo sondeo...", 3)
            }
        }

        // aquí se deberían crear los certificados para tenerlos listos y enviarlos
        Logger.log("Generando certificados para ser enviados a let's encrypt...", 2)
        let { publicKey, privateKey } = forge.pki.rsa.generateKeyPair(2048)
        let csr = forge.pki.createCertificationRequest()
        csr.publicKey = publicKey
        csr.setSubject([
            { name: 'commonName', value: dominio }
        ])
        csr.setAttributes([{
            name: 'extensionRequest',
            extensions: [{
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: dominio },
                ]
            }]
        }])
        csr.sign(privateKey, forge.md.sha256.create())
        // Convertir el objeto CSR de Forge a ASN.1
        const csrAsn1 = forge.pki.certificationRequestToAsn1(csr)
        // Convertir ASN.1 a DER (formato binario)
        const derBytes = forge.asn1.toDer(csrAsn1).getBytes()
        // Convertir los bytes a Buffer de Node y luego a base64url (SIN PEM headers)
        const csrBase64Url = Buffer.from(derBytes, 'binary').toString('base64url')
        Logger.success('Certificados generados correctamente.', 3)


        // Logger.info('Finalize request')
        Logger.log("Enviando certificado CSR a Let's Encrypt...", 2)
        let finalizeResult = await makeJOSEPostRequest(
            finalizeUrl,
            {
                csr: csrBase64Url
            },
            replayNonce,
            accPriKey,
            accountUrl
        )

        replayNonce = finalizeResult.headers['replay-nonce']
        Logger.info("Certificado CSR enviado a Let's Encrypt.", 3)



        /**
         * Decimo POST a la url de finalize sin nada y esperar a que devuelva el certificado pem
         * - Se envía un post vacío. Se envía firmado a modo de JSON Web Token
         * - Devuelve nonce y el estado de la petición o el certificado pem
         */
        let certURL = ''
        Logger.info("Sondeo de 2 segundos para comprobar el estado del certificado.", 2)
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 2 * 1000))
            // Logger.info('Check certificate request')
            Logger.log("Revisando estado del certificado.", 2)
            let challengeStatusResult = await makeJOSEPostRequest(
                orderUrl,
                '',
                replayNonce,
                accPriKey,
                accountUrl
            )

            replayNonce = challengeStatusResult.headers['replay-nonce']
            let status = challengeStatusResult.data['status']

            if (status === 'valid') {
                // certificate received
                certURL = challengeStatusResult.data['certificate']
                Logger.success("Certificado listo!", 3)
                break
            }

            if (status === 'processing') {
                Logger.log("Certificado en proceso, repitiendo sondeo...", 3)
            }
        }

        // guardar los certificados y marcar como verificado!
        Logger.log("Descargando el certificado PEM.", 2)
        let certResult = await makeJOSEPostRequest(
            certURL,
            '',
            replayNonce,
            accPriKey,
            accountUrl
        )
        Logger.info("Certificado descargado correctamente", 3)
        
        Logger.log("Finalizando...", 2)
        // guardar los certificados
        // público
        writeFileSync(SERVER_CRT_FILE_PATH, certResult.data, 'utf-8')
        Logger.success("Guardado certificado público", 3)
        // privado
        writeFileSync(SERVER_KEY_FILE_PATH, forge.pki.privateKeyToPem(privateKey), 'utf-8')
        Logger.success("Guardado certificado privado", 3)

        // marcar como verificado!
        ServerConfig.set('VALID_ACME_CERTIFICATES', true)

        // cerrar las instancias creadas (app se elimina sola)
        await new Promise((resolve, reject) => {
            httpServer.close(() => resolve(undefined))
        })
        Logger.success("Apagado servidor http", 3)
        Logger.success("Proceso de obtención de certificados completado.", 1)
    }
}

/**
 * revisa si existen los certificados y si son válidos
 */
function isActualCertValid() {
    if (!existsSync(SERVER_CRT_FILE_PATH) || !existsSync(SERVER_KEY_FILE_PATH)) {
        return false
    }
    
    // importar certificado
    let cert = new crypto.X509Certificate(readFileSync(SERVER_CRT_FILE_PATH))

    // comparar validez:
    // fechaActual  ===================
    // fechaCert    ===========
    // DIFF                    ========
    // si la diferencia es positiva entonces caducado
    let diff = (new Date()).getTime() - (new Date(cert.validTo)).getTime()
    if (diff > 0) {
        return false
    }

    // finalmente revisar la configuración (si ha sido marcado como true)
    return ServerConfig.get('VALID_ACME_CERTIFICATES', false) as true|false
}

/**
 * Ejecuta la petición y si falla muestra el error, esta función es para no repetir código
 */
async function makeJOSEPostRequest(url: string, payload: any, nonce: string, accPriKey: crypto.KeyObject, accountUrl?: string, accPubKey?: crypto.KeyObject) {
    let request
    try {
        request = await axios.post(
            url,
            signRequest(accPriKey, payload, nonce, url, accountUrl, accPubKey),
            {
                httpsAgent: userAgentToUse,
                headers: {
                    'Content-Type': 'application/jose+json'
                }
            }
        )

        // // debug:
        // console.log(request.status)
        // // @ts-ignore
        // console.log(request.headers.toJSON())
        // console.log(request.data)

        return request
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.warn(error.response.data)
                console.warn(error.response.status)
                // @ts-ignore solo nos interesa mostrar los headers si existen
                try { console.warn(error.response.headers.toJSON()) } catch (e) {}
                Logger.logError(error, 'ERROR ACME BAD REQUEST')
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                // console.warn(error.request)
                Logger.logError(error, 'ERROR OF NO RESPONSE REQUEST')
            } else {
                // Something happened in setting up the request that triggered an Error
                // console.warn('Error', error.message)
                Logger.logError(error, 'ERROR PREPARING THE REQUEST')
            }
            // console.warn(error.config)
        }

        throw new Error('FATAL: ACME Error', {
            cause: `Ha fallado la request hacía ${url} por alguna razón. (logs encima de este error).`
        })
    }
}

/**
 * Firma la request para que esté lista para comunicarse con el servidor ACME y lo devuelve como una JSON web token
 */
function signRequest(accPriKey: crypto.KeyObject, payload: any, nonce: string, url: string, accountUrl?: string, accPubKey?: crypto.KeyObject) {
    // preparar header
    const protectedHeader: {
        alg: string,
        nonce: string,
        url: string,
        kid?: string,
        jwk?: crypto.JsonWebKey
    } = {
        alg: "RS256",
        nonce: nonce,
        url: url
    }

    if (accountUrl && accPubKey) {
        throw Error('FATAL: Request build error', {
            cause: 'Se ha intentado asignar la public key y accountUrl juntas en el header del JSON web token para ACME.'
        })
    }

    if (accountUrl) {
        // cuando nos de la cuenta para usar, se usará eso en vez de la clave privada
        protectedHeader.kid = accountUrl
    }

    if (accPubKey) {
        // Solo para la primera petición (newAccount)
        protectedHeader.jwk = accPubKey.export({ format: 'jwk' })
    }

    // 2. Codificar Header y Payload a Base64URL
    const protectedEncoded = Buffer.from(JSON.stringify(protectedHeader)).toString('base64url')
    const payloadEncoded = payload === "" ? "" : Buffer.from(JSON.stringify(payload)).toString('base64url')

    // 3. Crear la firma
    // Se firma el string: "header_protegido.payload"
    const dataToSign = `${protectedEncoded}.${payloadEncoded}`
    
    const signature = crypto.sign(
        "sha256",
        Buffer.from(dataToSign), 
        {
            key: accPriKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }
    )

    // 4. Devolver el JSON final que se enviará por POST
    return {
        protected: protectedEncoded,
        payload: payloadEncoded,
        signature: Buffer.from(signature).toString('base64url')
    }
}

/**
 * Genera la Key Authorization necesaria para retos HTTP-01 o DNS-01.
 * Formato: token + "." + Base64URL(SHA256(JWK_ordenado))
 */
function getKeyAuthorization(token: string, accPubKey: crypto.KeyObject): string {
    // 1. Exportar la clave pública a formato JWK
    const jwk = accPubKey.export({ format: 'jwk' })

    // 2. ACME requiere que el JWK para el thumbprint esté ordenado alfabéticamente por sus campos
    // y no contenga espacios ni caracteres extra. Solo campos obligatorios: kty, n, e (para RSA)
    const components = {
        e: jwk.e,
        kty: jwk.kty,
        n: jwk.n
    }
    const canonicalJwk = JSON.stringify(components, Object.keys(components).sort())

    // 3. Calcular el hash SHA-256 del JWK canónico
    const thumbprint = crypto
        .createHash('sha256')
        .update(canonicalJwk)
        .digest('base64url')

    // 4. Devolver la unión del token y el thumbprint
    return `${token}.${thumbprint}`
}