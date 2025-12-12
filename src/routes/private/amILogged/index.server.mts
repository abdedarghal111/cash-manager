/**
 * endpoint para saber si estas logueado.
 */
import { User } from '@class/model/User.server.mjs'
import express from 'express'

// tipos que acepta y devuelve el servidor
export namespace GETamILoggedType {
    export interface client {}
    export interface server {
        username?: string
    }
}

export default express.Router().get("/amILogged", (req, res) => {
    // @ts-ignore está definido en el middleware y debe conectarse vía HttpsController.addPrivateRouter()
    let user = req.locals.user as User

    // responder con el usuario
    res.status(200).json({
        username: user.username
    })
})