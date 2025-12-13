/**
 * endpoint para gestionar toda la responsabilidad relacionada con las estadisticas
 */
import express from 'express'
import { User } from '@class/model/User.server.mjs'
import { Cuenta } from '@class/model/Cuenta.server.mjs'
import { Subcuenta } from '@class/model/Subcuenta.server.mjs'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'

export namespace GETEstadisticasType {
    export interface client {}

    export interface SubcuentaStats {
        id: number
        nombre: string
        total: number
    }

    export interface CuentaStats {
        id: number
        nombre: string
        total: number
        subcuentas: SubcuentaStats[]
    }

    export interface server {
        cuentas: CuentaStats[]
    }
}

const router = express.Router()

router.get('/estadisticas', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    const cuentas = await Cuenta.findAll({
        where: {
            owner: user.id
        }
    })

    const cuentasStats: GETEstadisticasType.CuentaStats[] = []

    for (const cuenta of cuentas) {
        const subcuentas = await Subcuenta.findAll({
            where: {
                cuenta: cuenta.id
            }
        })

        const totalCuenta = await cuenta.getTotal()

        const subcuentasStats: GETEstadisticasType.SubcuentaStats[] = subcuentas.map(sub => ({
            id: sub.id,
            nombre: sub.name,
            total: sub.total || 0
        }))

        cuentasStats.push({
            id: cuenta.id,
            nombre: cuenta.name,
            total: totalCuenta,
            subcuentas: subcuentasStats
        })
    }

    const response: GETEstadisticasType.server = {
        cuentas: cuentasStats
    }

    return res.status(200).json(response)
}))

export default router
