/**
 * endpoint para loguearte
 */
import express from 'express'
import bcrypt from 'bcrypt'
import { User } from '@class/model/User.server.mjs'
import HttpsController, { asyncErrorHandler } from '@single/HttpController.server.mjs'
import { SendCookie } from '@single/CookieParser.mjs'

// tipos que acepta y devuelve el servidor
export namespace POSTLoginType {
    export interface client {
        username: string,
        password: string
    }
    export interface server {
        message: string
    }
}

export default express.Router().post("/login", asyncErrorHandler(async (req, res, next) => {
    let body = req.body as POSTLoginType.client

    // parsear todos los datos
    if(!body) {
        return res.status(400).json({
            message: "No se ha recibido ningun dato válido"
        })
    }

    if(typeof body.username !== "string" || typeof body.password !== "string") {
        return res.status(400).json({
            message: "Los datos introducidos son incorrectos"
        })
    }

    // crear un usuario si está todo correcto
    let user = await User.findOne({ where: { username: body.username } })

    if (!user) {
        // no existe el usuario
        return res.status(401).json({
            message: "Credenciales incorrectas"
        })
    }

    // TODO: añadir máximo de intentos permitidos
    // comprobar que la contraseña es correcta
    if (!bcrypt.compareSync(body.password, user.password)) {
        // la contraseña es incorrecta
        return res.status(401).json({
            message: "Contraseña incorrecta"
        })
    }

    // crear la cookie de sesión
    let JWTCookie = new SendCookie('passport', '')
    await HttpsController.jwtController.newSessionToCookie(user.id, JWTCookie)
    JWTCookie.setAsSecure(req.locals.host)
    JWTCookie.setMaxAge('D', 14)

    res.status(201).header('Set-Cookie', JWTCookie.toString()).json({
        message: "Registrado correctamente"
    })
}))