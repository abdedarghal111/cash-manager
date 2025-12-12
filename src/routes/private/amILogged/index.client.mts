/**
 * Encargado del endpoint amILogged en la parte del cliente
 */
import { RequestsManager } from "@single/Requests.client.mjs"
import type { GETamILoggedType } from "./index.server.mjs"
import axios from "axios"

/**
 * Devuelve si el usuario esta logueado con el usuario o "" si no los está o false en caso de fallo
 * 
 * @returns {false|string}
 */
export async function GETamILogged() {
    let requester = RequestsManager.getRequester()
    let data: GETamILoggedType.client = {}

    try {
        let response = await requester<GETamILoggedType.server>({
            method: "GET",
            url: "/amILogged",
            data: data
        })

        // ha salido todo ok
        return response.data.username
    } catch (error) {
        if(axios.isAxiosError(error)) {
            if (error.response) {
                // La respuesta fue hecha y el servidor respondió con un código de estado
                // que esta fuera del rango de 2xx {error.response.data, error.response.status, error.response.headers}
                if(error.response.status === 401) {
                    return ""
                }
                // otra respuesta, te has equivocado de servidor otra vez
                return false
            } else if (error.request) {
                // La petición fue hecha pero no se recibió respuesta console.log(error.request);
                // servidor apagado o ruta incorrecta
                return false
            }
        } else {
            // Otro error extraño
            // no debería pasar
            console.error('Algo ocurrió mal:', error);
        }
    }
}