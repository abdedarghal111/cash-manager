/**
 * Endpoint encargado de la extracción, extrae el dinero que se le pida de las cuentas
 * si está disponible.
 */

import express from 'express'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'
import { User } from '@class/model/User.server.mjs'
import { Cuenta } from '@class/model/Cuenta.server.mjs'
import { CashBundle } from '@class/CashBundle.mjs'
import { AcceptedCashValues } from '@data/enums/AcceptedCashEquivalent.mjs'
import { DatabaseController } from '@single/DatabaseController.server.mjs'
import { TransactionsGroup } from '@class/model/TransactionGroup.server.mjs'
import { Validator } from '@single/Validator.mjs'

export namespace GETExtraccionCuentasType {
    export interface client {}
    export interface server {
        accounts: {
            id: number
            name: string
            total: number
            availableCash: AcceptedCashValues
        }[]
    }
}

export namespace POSTExtraccionType {
    export interface client {
        accountId: number
        description: string
        cash: AcceptedCashValues
    }
    export interface server {
        extractedCash: CashBundle // dinero sacado
        transactionUuid: string // uuid de la transacción
        accountName: string // nombre de la cuenta
        ConsultedSubAccounts: { // codigo subcuenta y cantidad sacada
            subAccountCode: string
            extractedCash: CashBundle
        }[]
    }
}

const router = express.Router()

router.get('/extraccion/cuentas', asyncErrorHandler(async (req, res) => {
    // @ts-ignore
    const user = req.locals.user as User
    
    // recoger cuentas
    const accounts = await Cuenta.findAll({
        where: { owner: user.id, ignore: false }
    })

    // Añadir también la cuenta de gastos a la lista
    const expensesAccount = await user.getExpensesAccount()
    accounts.push(expensesAccount)

    const result: GETExtraccionCuentasType.server = {accounts: []}

    for (const account of accounts) {
        // Calcular el total de dinero disponible en montos
        let totalBundle = await account.getAvailableCash()

        result.accounts.push({
            id: account.id,
            name: account.name,
            total: await account.getTotal(),
            availableCash: totalBundle.exportToAcceptedCashValues()
        })
    }

    res.json(result)
}))

router.post('/extraccion', asyncErrorHandler(async (req, res) => {
    const user = req.locals.user as User
    const body = req.body as POSTExtraccionType.client

    if (!body) {
        return res.status(400).json({ message: "No se ha aportado el cuerpo de petición." })
    }

    // validar y filtrar descripción primero
    let description = Validator.string(body.description)
    if (Validator.isNotValid(description)) {
        return res.status(400).json({message: "La descripción no puede estar vacía."})
    }
    description = Validator.escapeHTML(description)

    // validar que el cash esté correcto
    const requestedCash = CashBundle.importFromTable(body.cash)
    if (typeof requestedCash === 'string') {
        return res.status(400).json({ message: requestedCash })
    }
    if (requestedCash.isEmpty()) {
         return res.status(400).json({ message: "El monto a extraer no puede ser cero." })
    }

    // validar que la cuenta existe
    let accountId = Validator.parseInt(body.accountId)
    if (Validator.isNotValid(accountId)) {
        return res.status(400).json({message: "El identificador de la cuenta no es válido."})
    }
    let account: Cuenta|null

    // revisar si es la cuenta de gastos o una cuenta normal y rescatarla
    if (accountId === user.nullAccount) {
        account = await Cuenta.findOne({
            where: { id: accountId }
        })
    } else {
        account = await Cuenta.findOne({
            where: { id: accountId, owner: user.id }
        })
    }
    if (account === null) {
        return res.status(400).json({message: "No se ha encontrado la cuenta."})
    }

    // revisar si hay suficiente dinero
    // esta acción no asegura que existan los billetes que ha pedido el usuario pero puede prevenir gastar recursos extra.
    let totalAccountCash = await account.getTotalAvailableCash()
    if (totalAccountCash < requestedCash.getTotal()) {
        return res.status(400).json({ message: "No hay suficiente dinero en la cuenta para realizar esta transacción." })
    }
    

    // datos correctos, iniciar transacción
    const transaction = await DatabaseController.startTransaction()
    try {
        // Intentar realizar extracción
        let extractedResume = await account.extractCash(requestedCash, transaction)

        // si no se ha podido extraer todo entonces devolver error
        if (!extractedResume.satisfied) {
            await transaction.rollback()
            return res.status(400).json({ 
                message: "No se ha podido completar la transacción. Por falta de billetes del tipo solicitado en la cuenta." 
            })
        }

        // Crear transacción que registre la extracción
        const transactionGroup = await TransactionsGroup.createWithUuid(user.id, transaction)
        const movimiento = await transactionGroup.createNewMovimiento(transaction)
        movimiento.setAsExtraccion(account, extractedResume.extractedCash.getTotal(), description)
        await movimiento.save({ transaction: transaction })

        await transaction.commit()

        res.json({
            extractedCash: extractedResume.extractedCash,
            transactionUuid: transactionGroup.uuid,
            accountName: account.name,
            ConsultedSubAccounts: extractedResume.ConsultedSubAccounts,
        } as POSTExtraccionType.server)

    } catch (error) {
        await transaction.rollback()
        res.status(400).json({ message: "Error al realizar la extracción." })
    }
}))

export default router
