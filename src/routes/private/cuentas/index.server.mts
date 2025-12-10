/**
 * endpoint para gestionar toda la responsabilidad relacionada con las cuentas
 */
import express from 'express'
import { Cuenta } from '@class/model/Cuenta.server.mjs'
import { User } from '@class/model/User.server.mjs'

export namespace POSTCuentasType {
    export interface client {
        name: string
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
    }[]
}

// Tipos para GET /cuentas/:id
export namespace GETCuentaByIdType {
    export interface client {}
    export type server = {
        id: number
        name: string
        ownerId: number
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
    }
    export interface server {
        message: string
        cuenta?: {
            id: number
            name: string
        }
    }
}

const router = express.Router()

// GET /cuentas - Obtener todas las cuentas del usuario
router.get('/cuentas', async (req, res) => {
    // @ts-ignore
    const user = req.locals.user as User

    const accounts = await Cuenta.findAll({
        where: {
            owner: user.id
        }
    })

    let filteredAccounts: GETCuentasType.server = accounts.map((account) => {
        return {
            id: account.id,
            name: account.name,
            ownerId: account.owner
        }
    })
    return res.status(200).json(filteredAccounts as GETCuentasType.server)
})

// POST /cuentas - Crear una nueva cuenta
router.post('/cuentas', async (req, res) => {
    // @ts-ignore
    const user = req.locals.user as User
    const body = req.body as POSTCuentasType.client

    // Validar y sanear los datos
    if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return res.status(400).json({ message: 'El nombre de la cuenta es inválido' })
    }
    const accountName = body.name.trim()

    if (accountName.length > 50) {
        return res.status(400).json({ message: 'El nombre de la cuenta no puede contener más de 50 caracteres' })
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

    // Crear la cuenta
    const newAccount = await Cuenta.create({
        name: accountName,
        owner: user.id
    })

    return res.status(201).json({
        message: 'Cuenta creada correctamente',
        cuenta: newAccount.name,
        id: newAccount.id
    } as POSTCuentasType.server)
})

// GET /cuentas/:id - Obtener una cuenta específica
router.get('/cuentas/:id', async (req, res) => {
    // @ts-ignore
    const user = req.locals.user as User
    // recoger el parametro de la url
    const accountId = parseInt(req.params.id, 10)

    if (isNaN(accountId)) {
        return res.status(400).json({ message: 'El ID de la cuenta debe ser un número' })
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
        ownerId: account.owner
    }

    return res.status(200).json(filteredAccount as GETCuentaByIdType.server)
})

// PUT /cuentas/:id - Actualizar una cuenta
router.put('/cuentas/:id', async (req, res) => {
    // @ts-ignore
    const user = req.locals.user as User
    const accountId = parseInt(req.params.id, 10)
    const body = req.body as PUTCuentasType.client

    if (isNaN(accountId)) {
        return res.status(400).json({ message: 'El ID de la cuenta debe ser un número' })
    }

    if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return res.status(400).json({ message: 'El nombre de la cuenta es inválido' })
    }
    const newName = body.name.trim()

    if (newName.length > 50) {
        return res.status(400).json({ message: 'El nombre no puede contener más de 50 caracteres' })
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
            name: newName,
            owner: user.id
        }
    })

    if (existingAccount && existingAccount.id !== accountId) {
        return res.status(409).json({ message: 'Ya existe una cuenta con ese nombre' })
    }
    
    // Actualizar la cuenta
    await account.update({ name: newName })

    return res.status(200).json({
        message: 'Cuenta actualizada correctamente',
        cuenta: {
            id: account.id,
            name: account.name
        }
    } as PUTCuentasType.server)
})

// DELETE /cuentas/:id - Eliminar una cuenta
router.delete('/cuentas/:id', async (req, res) => {
    // @ts-ignore
    const user = req.locals.user as User
    const accountId = parseInt(req.params.id, 10)

    if (isNaN(accountId)) {
        return res.status(400).json({ message: 'El ID de la cuenta debe ser un número' })
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
})

export default router