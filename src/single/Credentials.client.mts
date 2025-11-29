/**
 * Se encarga básicamente de gestionar el usuario local.
 * 
 * ATENCIÓN: TENER LA CONTRASEÑA GUARDADA EN FLAT ES MUY PELIGROSO Y NO RECOMENDABLE
 * solo se ha realizado así en este proyecto por simplicidad
 */

import { storable } from "@class/Storable.client.mjs"
import { get } from "svelte/store"

let logged = storable("logged", false)
let username = storable("username", "")
let password = storable("password", "")

// logged.subscribe((val) => {
//     console.log("logged", val)
// })

// username.subscribe((val) => {
//     console.log("username", val)
// })

// password.subscribe((val) => {
//     console.log("password", val)
// })

export let Credentials = {
    /**
     * Devuelve si el usuario esta logueado
     * 
     * @returns {boolean}
     */
    isLogged: () => get(logged),

    /**
     * Establece si el usuario esta logueado
     * 
     * @param {boolean} logged 
     * @param {string} username 
     * @param {string} password 
     */
    setLogin: (_logged: boolean, _username: string = "", _password: string = "") => {
        logged.set(_logged)
        username.set(_username)
        password.set(_password)
    },

    /**
     * Establece si está logueado o no
     * 
     * @param {boolean} logged
     */
    setLogged: (_logged: boolean) => {
        logged.set(_logged)
    },

    /**
     * Devuelve las credenciales
     * 
     * @returns {object}
     */
    getCredentials: () => {
        return {
            logged: get(logged),
            username: get(username),
            password: get(password)
        }
    },

    /**
     * Devuelve las credentials reactivas
     * 
     * @returns {object}
     */
    getReactiveCredentials: () => {
        return {
            logged: logged,
            username: username,
            password: password
        }
    },
}