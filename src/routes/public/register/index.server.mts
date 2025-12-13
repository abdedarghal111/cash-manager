/**
 * endpoint para saber si estas logueado.
 */
import express from 'express'
import bcrypt from 'bcrypt'
import { User } from '@class/model/User.server.mjs'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'

// tipos que acepta y devuelve el servidor
export namespace POSTregisterType {
    export interface client {
        username: string,
        password: string
    }
    export interface server {
        message: string
    }
}

export default express.Router().post("/register", asyncErrorHandler(async (req, res, next) => {
    let body = req.body as POSTregisterType.client

    // si existe un usuario creado entonces negarse a registrar
    let allUsers = (await User.findAndCountAll()).count
    if (allUsers >= 1) {
        return res.status(403).json({
            message: "Ya existe un usuario, logueate o informa al administrador."
        })
    }

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

    if(body.password.length < 6) {
        return res.status(400).json({
            message: "La contraseña deben contener almenos 6 caracteres"
        })
    }

    if(body.username.length < 3) {
        return res.status(400).json({
            message: "El usuario debe contener almenos 3 caracteres"
        })
    }

    if(body.username.length > 50) {
        return res.status(400).json({
            message: "El nombre de usuario no puede contener más de 50 caracteres"
        })
    }

    // crear un usuario si está todo correcto
    let user = await User.create({
        username: body.username,
        password: bcrypt.hashSync(body.password, 10)
    })

    res.status(201).json({
        message: "Usuario creado correctamente"
    })
}))