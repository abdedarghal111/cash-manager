/**
 * Endpoint para gestionar toda la responsabilidad relacionada con el ingreso de monto,
 * incluyendo la gestión de gastos y la distribución entre cuentas.
 */
import express from 'express'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'
import { User } from '@class/model/User.server.mjs'
import { Cuenta } from '@class/model/Cuenta.server.mjs'
import { Subcuenta } from '@class/model/Subcuenta.server.mjs'
import { AcceptedCashValues } from '@data/enums/AcceptedCashEquivalent.mjs'
import { Op } from 'sequelize'

// obtener las estadisticas (get)
export namespace GETBalancesType {
    export interface client {}
    export interface server {
        summary: {
            cashPendingName: string
            cashPendienteCash: AcceptedCashValues
            cuentas: {
                accountName: string
                total: number
                subaccounts: {
                    total: number
                    totalPending: number
                    subAccountName: string
                    cash: AcceptedCashValues
                }[]
            }[]
            gastosCuenta: {
                accountName: string
                total: number
                subaccounts: {
                    total: number
                    totalPending: number
                    subAccountName: string
                    cash: AcceptedCashValues
                }[]
            }
        }
    }
}

const router = express.Router()

router.get('/balances', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // variable salida
    let outSummary = {} as GETBalancesType.server['summary']

    // recoger cuenta pendiente y subcuentas
    let pendingAccount = await user.getExpensesAccount()
    let pendingSubaccounts = await Subcuenta.findAll({
        where: {
            cuenta: pendingAccount.id
        }
    })
    // añadir cuenta gastos
    outSummary.gastosCuenta = {
        accountName: pendingAccount.name,
        total: await pendingAccount.getTotal(),
        subaccounts: []
    }
    // añadir subcuentas gastos
    for (let subaccount of pendingSubaccounts) {
        outSummary.gastosCuenta.subaccounts.push({
            total: subaccount.total,
            totalPending: subaccount.cashPending,
            subAccountName: subaccount.name,
            cash: (await subaccount.getMonto()).toAcceptedCashValues()
        })
    }

    // recoger metalico pendiente
    let pendingCash = await user.getPendingCash()
    outSummary.cashPendienteCash = pendingCash.toAcceptedCashValues()
    outSummary.cashPendingName = user.getPendingCashName()

    // recoger todas las cuentas
    let accounts = await Cuenta.findAll({
        where: {
            id: {
                [Op.not]: pendingAccount.id
            }
        }
    })
    // añadir cuentas normales
    outSummary.cuentas = []
    for (let account of accounts) { 
        let subaccountsArray = [] as {
            total: number
            totalPending: number
            subAccountName: string
            cash: AcceptedCashValues
        }[]

        outSummary.cuentas.push({
            accountName: account.name,
            total: await account.getTotal(),
            subaccounts: subaccountsArray
        })

        // obtener subcuentas
        let subaccounts = await Subcuenta.findAll({
            where: {
                cuenta: account.id,
            },
        })

        // añadir subcuentas
        for (let subaccount of subaccounts) {
            subaccountsArray.push({
                total: subaccount.total,
                totalPending: subaccount.cashPending,
                subAccountName: subaccount.name,
                cash: (await subaccount.getMonto()).toAcceptedCashValues()
            })
        }
    }

    // devolver el resultado
    return res.status(200).json({
        summary: outSummary
    } as GETBalancesType.server)
}))

export default router