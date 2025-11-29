/**
 * Contiene la instancia de axios para realizar las peticiones a la api
 */
import { storable } from "@class/Storable.client.mjs"
import axios, { AxiosInstance } from "axios"
import { Credentials } from "./Credentials.client.mts"
import { get, Writable } from "svelte/store"

let serverUrl = storable("serverUrl", "localhost")
let serverPort = storable("serverPort", "5432")

// se inicializa dentro de la función
let requester: null|AxiosInstance = null
let recreate = true

export let RequestsManager = {

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

            // aquí se establece el comportamiento por defecto, info: https://axios-http.com/docs/req_config
            requester = axios.create({
                baseURL: `https://${get(serverUrl)}:${get(serverPort)}`,
                timeout: 5000,
                method: "POST",
                allowAbsoluteUrls: false, // para que siempre url sea baseURL+url
                transformRequest: [function (data: { [x: string]: any; }, headers) {
                    // añadir las credenciales y empaquetar
                    let credentials = Credentials.getCredentials()
                    headers.set("username", credentials.username)
                    headers.set("password", credentials.password)
                    headers.set("Content-Type", "application/json")
                    return JSON.stringify(data)
                }],
                responseEncoding: 'utf8',
                responseType: "json",
                maxRedirects: 0, // ninguna redicección, es una api
                transport: 'https' // siempre usar https
            })
        }

        if(requester === null) {
            throw new Error("Esta linea no se debe ejecutar")
        }

        return requester
    },

    /**
     * Asigna un nuevo puerto y url al requester
     * 
     * @param {string} url 
     * @param {string} port 
     */
    setServerParameters: (url: string, port: string) => {
        serverUrl.set(url)
        serverPort.set(port)
        recreate = true
    },

    /**
     * devuelve la url y el puerto en un objeto reactivo para su uso en vistas
     * 
     * @returns {[Writable<string>, Writable<string>]}
     */
    getReactiveServerAndPort: () => {
        return [serverUrl, serverPort] as [Writable<string>, Writable<string>]
    }

}