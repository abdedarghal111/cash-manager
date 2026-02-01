/**
 * Contiene la instancia de axios para realizar las peticiones a la api
 */
import { storable } from "@class/Storable.client.mjs"
import axios, { AxiosInstance } from "axios"
import { get, Writable } from "svelte/store"
import toast from "svelte-french-toast"

let serverUrl = storable("serverUrl", "localhost")
let serverPort = storable("serverPort", "5432")
let usingHttps = storable("usingHttps", false)

// se inicializa dentro de la función
let requester: null|AxiosInstance = null
let recreate = true

export let RequestsManager = {
    /**
     * Devuelve si se está usando https
     */
    getUsingHttps: () => {
        return get(usingHttps)
    },

    /**
     * Aplica si usar https o http
     */
    setUseHttps: (useHttps: boolean) => {
        usingHttps.set(useHttps)
    },

    /**
     * Devuelve el requester listo con las configuraciones adecuadas
     * 
     * @returns {AxiosInstance}
     */
    getRequester: () => {
        if (recreate) {
            // primero se borra la instancia antigua
            requester = null
            recreate = false

            if(get(serverUrl) === "" || get(serverPort) === "") {
                console.error("NO SE HA ESTABLECIDO UN SERVIDOR VÁLIDO")
            }
            
            let protocol = get(usingHttps) ? 'https' : 'http'

            // aquí se establece el comportamiento por defecto, info: https://axios-http.com/docs/req_config
            requester = axios.create({
                baseURL: `${protocol}://${get(serverUrl)}:${get(serverPort)}`,
                timeout: 5000,
                method: "POST",
                allowAbsoluteUrls: false, // para que siempre url sea baseURL+url
                transformRequest: [function (data: { [x: string]: any }, headers) {
                    headers.set("Content-Type", "application/json")
                    headers.set('version', __VERSION__)
                    return JSON.stringify(data)
                }],
                responseEncoding: 'utf8',
                responseType: "json",
                maxRedirects: 0, // ninguna redicección, es una api
                transport: protocol,
                withCredentials: true // para guardar las cookies
            })
        }

        if(requester === null) {
            throw new Error("Esta linea no se debe ejecutar")
        }

        return requester
    },

    /**
     * Asigna un nuevo puerto y url al requester
     */
    setNewSettings: (url: string, port: string, usingHTTPS: boolean) => {
        serverUrl.set(url)
        serverPort.set(port)
        usingHttps.set(usingHTTPS)
        recreate = true
    },

    /**
     * devuelve la url y el puerto en un objeto reactivo para su uso en vistas
     */
    getReactiveSettings: () => {
        return [serverUrl, serverPort, usingHttps] as [Writable<string>, Writable<string>, Writable<boolean>]
    },

    /**
     * Realiza una petición genérica a la API y maneja las respuestas y errores.
     * @template RequestType Un tipo que debe contener las propiedades `client` (opcional) y `server` para los tipos de la petición y respuesta.
     * @param {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} method - El método HTTP.
     * @param {string} url - La URL del endpoint.
     * @param {ClientRequestType} [data] - Los datos opcionales para enviar en el cuerpo de la petición.
     * @returns {Promise<ServerRequestType | false>} La data de la respuesta del servidor o `false` si ocurre un error.
     */
    makeRequest: async <ServerRequestType, ClientRequestType>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url: string,
        data?: ClientRequestType
    ): Promise<ServerRequestType | false> => {
        const requester = RequestsManager.getRequester()
        try {
            const response = await requester<ClientRequestType>({
                method: method,
                url: url,
                data: data
            })

            return response.data as unknown as ServerRequestType
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.data) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error('No se ha podido conectar con el servidor.')
                    console.error(error)
                }
            } else {
                toast.error('Ha ocurrido un error inesperado.')
                console.error(error)
            }
            return false
        }
    }
}