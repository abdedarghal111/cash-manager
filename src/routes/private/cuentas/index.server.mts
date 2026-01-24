/**
 * endpoint para gestionar toda la responsabilidad relacionada con las cuentas
 */
import express from 'express'
import { Cuenta } from '@class/model/Cuenta.server.mjs'
import { User } from '@class/model/User.server.mjs'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'
import { Validator } from '@single/Validator.mjs'

export namespace POSTCuentasType {
    export interface client {
        name: string,
        percentage: number,
        isRemainder: boolean
    }
    export interface server {
        message: string
        cuenta: string // nombre de la cuenta
        id: number
    }
}

export namespace GETCuentasType {
     export interface client {}
    export type server = {
        id: number
        name: string
        ownerId: number
        percentage: number
        isRemainder: boolean
    }[]
}

// Tipos para GET /cuentas/:id
export namespace GETCuentaByIdType {
    export interface client {}
    export type server = {
        id: number
        name: string
        ownerId: number
        percentage: number
        isRemainder: boolean
    }
}

// Tipos para DELETE /cuentas/:id
export namespace DELETECuentaType {
    export interface client {}
    export type server = {
        message: string
    }
}

// Tipos para PUT /cuentas/:id
export namespace PUTCuentasType {
    export interface client {
        name: string
        percentage: number
        isRemainder: boolean
    }
    export interface server {
        message: string
        id: number
        name: string
        percentage: number
        isRemainder: boolean
    }
}

const router = express.Router()

// GET /cuentas - Obtener todas las cuentas del usuario
router.get('/cuentas', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    const accounts = await Cuenta.findAll({
        where: {
            owner: user.id,
            ignore: false
        }
    })

    let filteredAccounts: GETCuentasType.server = accounts.map((account) => {
        return {
            id: account.id,
            name: account.name,
            ownerId: account.owner,
            percentage: account.percentage,
            isRemainder: account.isRemainder
        }
    })
    return res.status(200).json(filteredAccounts as GETCuentasType.server)
}))

// POST /cuentas - Crear una nueva cuenta
router.post('/cuentas', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User
    const body = req.body as POSTCuentasType.client

    // Validar y sanear los datos
    if (!body) {
        return res.status(400).json({ message: 'Los datos de la cuenta son obligatorios' })
    }

    const accountName = Validator.string(body.name)
    if (Validator.isNotValid(accountName)) {
        return res.status(400).json({ message: 'El nombre de la cuenta es inválido' })
    }
    if (accountName.length > 50) {
        return res.status(400).json({ message: 'El nombre de la cuenta no puede contener más de 50 caracteres' })
    }

    let percentage = Validator.number(body.percentage)
    if (Validator.isNotValid(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({ message: 'El porcentaje debe ser un número entre 0 y 100' })
    }

    const isRemainder = Validator.boolean(body.isRemainder)
    if (Validator.isNotValid(isRemainder)) {
        return res.status(400).json({ message: 'El campo isRemainder debe ser un booleano' })
    }

    // Comprobar si ya existe una cuenta con ese nombre para el usuario
    const existingAccount = await Cuenta.findOne({
        where: {
            name: accountName,
            owner: user.id
        }
    })

    if (existingAccount) {
        return res.status(409).json({ message: 'Ya existe una cuenta con ese nombre' })
    }

    // si se ha establecido como la que tiene el restante, remover las que tengan restante
    if (isRemainder) {
        await Cuenta.removeAllIsRemainderForUser(user.id)
        percentage = 0
    }

    // restar el porcentaje a otras cuentas de mayor a menor
    await Cuenta.removeExcessMarginFromUser(user.id, percentage)

    // Crear la cuenta y asignarle el porcentaje y el isRemainder
    const newAccount = await Cuenta.create({
        name: accountName,
        owner: user.id,
        percentage: percentage,
        isRemainder: isRemainder
    })

    return res.status(201).json({
        message: 'Cuenta creada correctamente',
        cuenta: newAccount.name,
        id: newAccount.id
    } as POSTCuentasType.server)
}))

// GET /cuentas/:id - Obtener una cuenta específica
router.get('/cuentas/:id', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // recoger el parametro de la url
    const accountId = Validator.parseInt(req.params.id)
    if (Validator.isNotValid(accountId)) {
        return res.status(400).json({ message: 'El ID de la cuenta no es valido' })
    }

    const account = await Cuenta.findOne({
        where: {
            id: accountId,
            owner: user.id
        }
    })

    if (!account) {
        return res.status(404).json({ message: 'Cuenta no encontrada' })
    }

    const filteredAccount: GETCuentaByIdType.server = {
        id: account.id,
        name: account.name,
        ownerId: account.owner,
        percentage: account.percentage,
        isRemainder: account.isRemainder
    }

    return res.status(200).json(filteredAccount as GETCuentaByIdType.server)
}))

// PUT /cuentas/:id - Actualizar una cuenta
router.put('/cuentas/:id', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // recoger el parametro de la url
    const accountId = Validator.parseInt(req.params.id)
    if (Validator.isNotValid(accountId)) {
        return res.status(400).json({ message: 'El ID de la cuenta no es valido' })
    }
    
    // Validar y sanear los datos
    const body = req.body as PUTCuentasType.client

    let validatedName = Validator.string(body.name)
    if (Validator.isNotValid(validatedName)) {
        return res.status(400).json({ message: 'El nombre de la cuenta es inválido' })
    }
    if (validatedName.length > 50) {
        return res.status(400).json({ message: 'El nombre de la cuenta no puede contener más de 50 caracteres' })
    }

    let percentage = Validator.number(body.percentage)
    if (Validator.isNotValid(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({ message: 'El porcentaje debe ser un número entre 0 y 100' })
    }

    let isRemainder = Validator.boolean(body.isRemainder)
    if (Validator.isNotValid(isRemainder)) {
        return res.status(400).json({ message: 'El campo isRemainder debe ser un booleano' })
    }

    // Verificar que la cuenta existe y pertenece al usuario
    const account = await Cuenta.findOne({
        where: {
            id: accountId,
            owner: user.id
        }
    })
    if (!account) {
        return res.status(404).json({ message: 'Cuenta no encontrada' })
    }

    // Verificar si ya existe otra cuenta con el nuevo nombre
    const existingAccount = await Cuenta.findOne({
        where: {
            name: validatedName,
            owner: user.id
        }
    })

    if (existingAccount && existingAccount.id !== accountId) {
        return res.status(409).json({ message: 'Ya existe una cuenta con ese nombre' })
    }

    // si se ha establecido como la que tiene el restante, remover las que tengan restante
    if (isRemainder) {
        await Cuenta.removeAllIsRemainderForUser(user.id)
        percentage = 0
    }

    // restar el porcentaje a otras cuentas de mayor a menor
    await Cuenta.removeExcessMarginFromUser(user.id, percentage)
    
    // Actualizar la cuenta y asignarle el porcentaje y el isRemainder
    await account.update({
        name: validatedName,
        percentage: percentage,
        isRemainder: isRemainder
    })

    return res.status(200).json({
        message: 'Cuenta actualizada correctamente',
        id: account.id,
        name: account.name,
        percentage: account.percentage,
        isRemainder: account.isRemainder    
    } as PUTCuentasType.server)
}))

// DELETE /cuentas/:id - Eliminar una cuenta
router.delete('/cuentas/:id', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // inabilitar temporalmente el no poder borrar la cuenta
    // algunas cuentas ya han participado en el historial por lo que no deben de poder ser borradas
    // TODO: implementar prevenir borrar cuentas que ya han tenido transferencias o participado en transferencias
    return res.status(501).send('Desactivado por integridad de datos')

    // revisar que esté el id
    const accountId = Validator.parseInt(req.params.id)
    if (Validator.isNotValid(accountId)) {
        return res.status(400).json({ message: 'El ID de la cuenta no es valido' })
    }

    // Find the account first to check balance
    const account = await Cuenta.findOne({
        where: {
            id: accountId,
            owner: user.id
        }
    })

    if (!account) {
        return res.status(404).json({ message: 'Cuenta no encontrada' })
    }

    // Check account balance
    const balance = await account.getTotal()
    if (balance !== 0) {
        return res.status(409).json({ message: 'La cuenta no se puede eliminar porque tiene un saldo pendiente.' })
    }

    const result = await Cuenta.destroy({
        where: {
            id: accountId,
            owner: user.id
        }
    })

    if (result === 0) {
        // This case should ideally not be reached if account was found, but good for safety
        return res.status(404).json({ message: 'Cuenta no encontrada o ya eliminada' })
    }

    return res.status(200).json({ message: 'Cuenta eliminada correctamente' } as DELETECuentaType.server)
}))

export default router