/**
 * Inspirado en el cookie parser de express.js: https://github.com/expressjs/cookie-parser
 * 
 * Obtiene el string de cookies y lo convierte en un array con objetos de cookies
 */

/**
 * Clase que obtiene y maneja las cookies pasadas por request
 */
export class CookieParser {
    private static readonly SEPARATOR = ';'
    private static readonly PAIR_SEPARATOR = '='

    public cookies: { [key:string]: ReceivedCookie } = {}

    /**
     * Recibe las cookies de req.headers.cookie
     * 
     * @param cookiesString un string con las cookies
     */
    constructor(cookiesString: any) {
        // verificar que es un string
        if (typeof cookiesString !== 'string') {
            return this
        }

        // separar la cookie una por una
        let strCookies = cookiesString.split(CookieParser.SEPARATOR)
        for (let strCookie of strCookies) {
            strCookie = strCookie.trim()

            if (strCookie.length <= 2) {
                // saltar porque debe tener mínimo 2 carácteres
                continue
            }

            let separatorPos = strCookie.indexOf(CookieParser.PAIR_SEPARATOR)
            if (separatorPos === -1) {
                // saltar porque no existe separador de claves
                continue
            }

            let name = strCookie.substring(0, separatorPos).trim()
            let value = strCookie.substring(separatorPos + 1).trim()

            if (name === '') {
                // si no hay name saltar
                // el value si que puede estar vacío
                continue
            }

            // guardar la cookie
            this.cookies[name] = new ReceivedCookie(name, decodeURIComponent(value))
        }
    }

    /**
     * Devuelve una cookie de las guardadas
     */
    get(name: string): ReceivedCookie|null {
        let founded = this.cookies[name]
        if (founded === undefined) {
            return null
        }
        return founded
    }
}

// tipos de algunas de las propiedades
type sameSiteType = 
    'Default' // que el navegador decida
|   'None'      // sin reestricciones
|   'Lax'       // no se envía a terceros pero si si haces click en el enlace que lo lleva a tu web
|   'Strict'    // solo se envía a tu propia web

/**
 * El objeto de cookie que se recibe del cliente (solo tiene el nombre y el valor)
 */
export class ReceivedCookie {
    // nombre de la cookie
    declare public name: string
    // valor de la cookie
    declare public value: string

    constructor(name: string, value: string) {
        this.name = name
        this.value = value
    }

    /**
     * Para convertir la cookie en una sendCookie ya sea para actualizarla o marcarla como eliminada y pasarla al cliente
     */
    toSendCookie() {
        return new SendCookie(this.name, this.value)
    }
}

/**
 * El objeto de una cookie con funciones útiles para crearlas o gestionarlas
 * 
 * Importante: son las cookies que el servidor manda al cliente
 * 
 * https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html
 */
export class SendCookie extends ReceivedCookie {
    // // si una cookie es firmada o no
    // declare public signed: boolean // not implemented

    // atributo "Expires": máxima vida de la cookie representada en date y time (si no se pone nada solo dura la sesión actual del navegador)
    declare public expires: Date | null
    // atributo "Max-Age": máxima vida de la cookie representada en segundos (si no se pone nada solo dura la sesión actual del navegador)
    declare public maxAge: number | null
    // atributo "Domain": host a los que se les puede enviar la cookie (solo uno, pero los subdominios del mismo también)
    declare public domain: string
    // atributo "Path": el directorio y sus subdirectorios que pueden acceder a la cookie
    declare public path: string
    // atributo "Secure": envia la cookie solo si es por un canal seguro
    declare public secure: boolean
    // atributo "HttpOnly": permitir que la cookie solo sea accedida vía HTTP (invisible para otros protocolos)
    declare public httpOnly: boolean
    // atributo "SameSite": permitir enviar la cookie solo al mismo sitio que la solicitó
    declare public sameSite: sameSiteType | null

    /**
     * rellena los campos a partir los argumentos recibidos
     */
    constructor(name: string, value: string, extra: {
        // signed?: boolean, // not implemented
        expires?: Date,
        maxAge?: number,
        domains?: string,
        path?: string,
        secure?: boolean,
        httpOnly?: boolean,
        sameSite?: sameSiteType
    } = {}) {
        super(name, value)
        // valores colocados o por defecto
        // this.signed = extra.signed ?? false // not implemented
        this.expires = extra.expires ?? null // solo dura la sesión abierta del navegador
        this.maxAge = extra.maxAge ?? null // solo dura la sesión abierta del navegador
        this.domain = extra.domains ?? ''
        this.path = extra.path ?? ''
        this.secure = extra.secure ?? true // tiene que tener secure siempre (reestricciones raras que dificultan las cosas)
        this.httpOnly = extra.httpOnly ?? false
        this.sameSite = extra.sameSite ?? null
    }

    /**
     * Establece el tiempo en la unidad que le indiques sobre cuando caduca la cookie (en maxAge y expires)
     * 
     * También acepta cantidades negativas (para eliminar la cookie)
     * 
     * @param countType 's'|'m'|'h'|'D'|'M' 's': segundos, 'm': minutos, 'h': horas, 'D': días, 'M': meses
     */
    public setMaxAge(countType: 's'|'m'|'h'|'D'|'M', cuantity: number) {
        let cuantityMultiplier = 1

        // que vaya multiplicando conforme sea más grande el dígito
        switch (countType) {
            // @ts-ignore (quiero que haga los demás si se cumple)
            case 'M': cuantityMultiplier *= 30
            // @ts-ignore (quiero que haga los demás si se cumple)
            case 'D': cuantityMultiplier *= 24
            // @ts-ignore (quiero que haga los demás si se cumple)
            case 'h': cuantityMultiplier *= 60
            case 'm': cuantityMultiplier *= 60
            // case 's': cuantityMultiplier *= 1
        }

        if (this.expires === null) {
            // crear un date con el tiempo actual
            this.expires = new Date()
        }

        // obtener los segundos totales
        let totalSeconds = Math.trunc(cuantity * cuantityMultiplier)

        // establecer el total de tiempo
        this.expires.setSeconds(this.expires.getSeconds() + totalSeconds)
        this.maxAge = totalSeconds
    }

    /**
     * Caduca una cookie para que se elimine en cuanto la reciba el usuario y la pone vacía
     */
    public setAsDeleted() {
        // vaciar valor
        this.value = ''
        // colocar tiempo de hace 300 días (por si el usuario tiene el tiempo descuadrado un poco)
        this.setMaxAge('D', -100)
    }

    /**
     * Modifica las propiedades para que tenga las flags de cookie segura o para datos sensibles
     * 
     * para ello se tiene que pasar la url del servidor para colocarla
     */
    public setAsSecure(hostUrl: string) {
        // establecer el origen de la cookie
        this.domain = hostUrl
        // this.domain = 'localhost:5432'
        // establecer como seguro
        this.secure = true
        // solo accesible por http
        this.httpOnly = true
        // evitar enviar la cookie a sitios externos
        this.sameSite = 'None' // no se puede poner como "strict" porque osinó se trata como "cross-site" (debido a que este servidor es externo a la página)
    }

    /**
     * Devuelve la cookie como string, estando lista para devolverla como `Set-Cookie: ${cookie.toString()}`
     */
    toString(): string {
        let out = ''

        // nombre y valor de la cookie
        out += `${this.name}=${encodeURIComponent(this.value)}`
        
        // fecha de expiración si no es null
        if (this.expires !== null) {
            out += `; Expires=${this.expires.toUTCString()}`
        }

        // max age en segundos si no es null
        if (this.maxAge !== null) {
            out += `; Max-Age=${this.maxAge}`
        }

        // dominios permitidos
        if (this.domain !== '') {
            out += `; Domain=${this.domain}`
        }

        // path de la cookie
        if (this.path !== '') {
            out += `; Path=${this.path}`
        }

        // si es secure
        if (this.secure === true) {
            out += '; Secure'
        }
        
        // path de la cookie
        if (this.httpOnly) {
            out += '; HttpOnly'
        }

        // samesite
        if (this.sameSite !== null) {
            out += `; SameSite=${this.sameSite}`
        }

        return out
    }
}