/**
 * Encargado del endpoint amILogged en la parte del cliente
 */
import { RequestsManager } from "@single/Requests.client.mjs"
import type { POSTregisterType } from "../register/index.server.mjs"
import axios from "axios"
import { Credentials } from "@single/Credentials.client.mjs"

/**
 * Devuelve si se ha creado el usuario con los datos del usuario guardado actual
 * 
 * @returns {status = number, message = string}
 */
export async function POSTregister() {

    let requester = RequestsManager.getRequester()
    let currentCredentils = Credentials.getCredentials()

    let data: POSTregisterType.client = {
        username: currentCredentils.username,
        password: currentCredentils.password
    }

    try {
        let response = await requester<POSTregisterType.server>({
            method: "POST",
            url: "/register",
            data: data
        })

        // ha salido todo ok
        return {
            status: response.status,
            message: response.data.message
        }
    } catch (error) {
        if(axios.isAxiosError(error) && error.response) {
            // La respuesta fue hecha y el servidor respondió con un código de estado
            // que esta fuera del rango de 2xx {error.response.data, error.response.status, error.response.headers}
            return {
                status: error.response.status,
                message: error.response.data.message as string
            }
        }
        // Otro error extraño
        // no debería pasar
        throw new Error('Fallo crítico', { cause: error })
    }
}