/**
 * Endpoint para gestionar toda la responsabilidad relacionada con el ingreso de monto,
 * incluyendo la gestión de gastos y la distribución entre cuentas.
 */
import express from 'express'
import Decimal from 'decimal.js'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'
import { User } from '@class/model/User.server.mjs'
import { Expense, TotalMonthlyToPayType } from '@class/model/Expense.server.mjs'
import { Cuenta, PercentageFormattedCuentas } from '@class/model/Cuenta.server.mjs'
import { Subcuenta } from '@class/model/Subcuenta.server.mjs'
import { AcceptedCashValues } from '@data/enums/AcceptedCashEquivalent.mjs'
import { CashBundle } from '@class/CashBundle.mjs'
import { TransactionsGroup } from '@class/model/TransactionGroup.server.mjs'
import { Monto } from '@class/model/Monto.server.mjs'
import { DatabaseController } from '@single/DatabaseController.server.mjs'
import { Transaction } from 'sequelize'

// obtener la previsualización del monto (get)
export namespace POSTPrevisualizarIngresarMontoType {
    export interface client {
        monto: AcceptedCashValues
    }
    export interface server {
        summary: {
            name: string;
            after: number;
            before: number;
        }[]
    }
}

// guardar los cambios (post)
export namespace POSTIngresarMontoType {
    export interface client {
        monto: AcceptedCashValues
    }
    export interface server {
        summary: {
            transactionUuid: string
            cashPendingName: string
            cashPendienteDiff: AcceptedCashValues
            cuentasBundleDiff: {
                accountName: string
                subAccountName: string
                diffCash: AcceptedCashValues
            }[]
            gastosBundleDiff: {
                accountName: string
                subAccountName: string
                diffCash: AcceptedCashValues
            }[]
        }
    }
}

const router = express.Router()

// es contradictorio porque recibe la cuenta pero devuelve los cambios que se harán (no hace modificaciones)
router.post('/previsualizarIngresarMonto', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User
    
    let body = req.body as POSTPrevisualizarIngresarMontoType.client

    if (!body) {
        return res.status(400).json({
            message: "No se proporcionó el cuerpo de la solicitud"
        })
    }

    // validar el metálico y guardar valores válidos:
    let inputCash = body.monto
    
    let cleanCash = CashBundle.importFromTable(inputCash)

    if (typeof cleanCash === "string") {
        return res.status(400).json({
            message: cleanCash
        })
    }

    // obtener la estimación
    const estimation = await calculateExpenseImpact(user, cleanCash)

    // si ha salido algún error enviarlo
    if (typeof estimation === 'string') {
        return res.status(400).json({
            message: estimation
        })
    }

    // devolver el resultado
    return res.status(200).json({
        // devolver solo datos solicitados
        summary: estimation.cuentas.map(accountSummary => ({
            name: accountSummary.name,
            after: accountSummary.after,
            before: accountSummary.before
        }))
    } as POSTPrevisualizarIngresarMontoType.server)
}))


router.post('/ingresarMonto', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User
    
    let body = req.body as POSTIngresarMontoType.client

    if (!body) {
        return res.status(400).json({
            message: "No se proporcionó el cuerpo de la solicitud"
        })
    }
    
    // validar el metálico y guardar valores válidos:
    let inputCash = body.monto
    
    let cleanCash = CashBundle.importFromTable(inputCash)

    if (typeof cleanCash === "string") {
        return res.status(400).json({
            message: cleanCash
        })
    }

    // obtener la estimación
    let estimation = await calculateExpenseImpact(user, cleanCash)

    // si ha salido algún error enviarlo
    if (typeof estimation === 'string') {
        return res.status(400).json({
            message: estimation
        })
    }

    // comenzar transacción de manera segura
    let transaction = await DatabaseController.startTransaction()

    let summary

    try {
        // realizar operación y obtener un resumen de los billetes movidos
        summary = await aplyIngresarOperation(user, estimation, cleanCash, transaction)
        // si salió bien escribir operaciones
        await transaction.commit()
    } catch (e) {
        console.error(e)
        // si hubo error volver atras
        await transaction.rollback()
        return res.status(500).json({
            message: "Error al procesar la transacción",
        })
    }

    let outSummary = {
        transactionUuid: summary.transactionUuid,
        cashPendingName: user.getPendingCashName(),
        cashPendienteDiff: summary.afterPendingMonto.subMonto(summary.beforePendingCash).exportToAcceptedCashValues(),
        cuentasBundleDiff: summary.cuentasOpetarionLogs.map(([account, subAccount, monto, beforeCash, afterCash]) => {
            return {
                accountName: account.name,
                subAccountName: subAccount.name,
                diffCash: afterCash.subMonto(beforeCash).exportToAcceptedCashValues()
            }
        }),
        gastosBundleDiff: summary.gastosAccountOperationLogs.map(([account, subAccount, monto, beforeCash, afterCash]) => {
            return {
                accountName: account.name,
                subAccountName: subAccount.name,
                diffCash: afterCash.subMonto(beforeCash).exportToAcceptedCashValues()
            }
        })
    }

    // devolver el resultado
    return res.status(200).json({
        summary: outSummary
    } as POSTIngresarMontoType.server)
}))

export default router

// /**
//  * Función para validar el monto introducido
//  * 
//  * Si falla devuelve string con la causa
//  */
// export function validateMonto(monto: AcceptedCashValues): AcceptedCashValues | string {
//     if (!monto) {
//         return "No se proporcionó el monto"
//     }
    
//     let cleanCash: AcceptedCashValues = {
//         cincuenta: 0,
//         veinte: 0,
//         diez: 0,
//         dos: 0,
//         cinco: 0,
//         dos: 0,
//         uno: 0,
//         cerocincuenta: 0,
//         ceroveinte: 0,
//         cerodiez: 0,
//         cerocinco: 0,
//         cerodos: 0,
//         cerouno: 0,
//     }

//     // validar tabla
//     if (typeof monto !== 'object') {
//         return 'El monto ingresado no es un objeto válido'
//     }

//     // validar cada uno de los valores
//     for (let keyCash of Object.keys(cleanCash) as Array<keyof AcceptedCashValues>) {
//         let number = Validator.int(monto[keyCash])
//         if (Validator.isNotValid(number) || number < 0) {
//             // si algun valor no es válido devolver
//             return `El monto ingresado para ${AcceptedCashEquivalent[keyCash]} no es válido`
//         }
//         // ingresar solo los valores que nos interesan
//         cleanCash[keyCash] = number
//     }

//     return cleanCash
// }

export type cuentasBalanceDiffType = {
    instance: Cuenta
    name: string
    after: number
    before: number,
    moneyToSum: number
}[]

export type calculateExpenseImpactType = {
    totalExpenses: TotalMonthlyToPayType["totalExpenses"]
    expensesList: TotalMonthlyToPayType["expenseList"]
    cuentas: cuentasBalanceDiffType
}

/**
 * Función que devuelve el antes y después a aplicar a cuentas y subcuentas al aplicar gastos dado un monto
 * 
 * Requisitos para que funcione:
 * 
 * - Debe existir una cuenta remaining
 * - Debe de existir un monto
 * - el porcentaje no debe de superar el 100%
 * - deben de haber cuentas
 * 
 * Si algo sale mal, devuelve un string explicando un porqué si no, devuelve los cambios que serán hechos
 */
export async function calculateExpenseImpact(user: User, cashBundle: CashBundle): Promise<calculateExpenseImpactType | string> {
    // Se usa Decimal.js para controlar los errores de coma flotante

    // recoger datos
    let accounts = await Cuenta.getAllPercentageFormatted(user)
    let expenseData = await Expense.getTotalMonthlyToPayResume(user)
    let totalExpenses = expenseData.totalExpenses

    // si no existen cuentas entonces fallar
    if (accounts.length === 0) {
        return "No existen cuentas creadas."
    }

    // primero extraer la cuenta con el resto
    let existsLastAccount = (accounts.length !== 0 && accounts.at(0)!.percentage === -1)
    let lastAccount = existsLastAccount ? accounts.shift()! : false
    
    // verificaciones
    if (lastAccount === false) {
        return "Falta una cuenta para el porcentaje restante."
    }

    let percentagesSum = 0
    let accountsToFilter: PercentageFormattedCuentas = []
    for (let acc of accounts) {
        // si es menor que cero está mal
        if (acc.percentage < 0) {
            return `Cuenta ${acc.name} con un porcentaje inválido.`
        }

        // si es igual a cero añadirla a tabla de eliminación
        if (acc.percentage === 0) {
            accountsToFilter.push(acc)
        } else {
            // sumar al total
            percentagesSum = Decimal.sum(percentagesSum, acc.percentage).toNumber()
        }
    }
    // console.log(`percentajes total: ${percentagesSum}`)

    // si es mayor que la suma está mal
    if (percentagesSum > 100) {
        return `La suma de porcentajes de cuentas supera el 100% que es el máximo permitido.`
    }

    // eliminar cuentas sobrantes
    accounts = accounts.filter(acc => !accountsToFilter.includes(acc))
    // console.log(accounts)

    // contar todo el cash
    let totalAmout = cashBundle.getTotal()
    // console.log(`cash total: ${totalAmout}`)

    // si no hay efectivo está mal
    if (totalAmout === 0) {
        return "No se ha ingresado ningún monto"
    }

    // console.log(`total gastos: ${totalExpenses}`)

    // primero restar los gastos
    let totalRemainingAmount =  Decimal.sub(totalAmout, totalExpenses).toNumber() 

    // console.log(`total gastos descontados: ${totalRemainingAmount}`)
    
    // si el dinero queda en negativo está mal
    if (totalRemainingAmount < 0) {
        return `Los gastos superan el importe introducido con un desfase de ${Math.abs(totalRemainingAmount)}.`
    }

    // repartir el dinero con el porcentaje de cada cuenta
    let toSubtract = 0 // lo que se le debe restar al remaining del Total
    let outCuentas = [] as cuentasBalanceDiffType
    for (let cuenta of accounts) {
        // añadir al cómputo como va a quedar la cuenta
        let accountSum = parseFloat(Decimal.mul(Decimal.div(cuenta.percentage, 100), totalRemainingAmount).toFixed(2))
        toSubtract = Decimal.sum(toSubtract, accountSum).toNumber()
        outCuentas.push({
            instance: cuenta.instance,
            name: cuenta.name,
            after: cuenta.currentTotal,
            before: Decimal.sum(cuenta.currentTotal, accountSum).toNumber(),
            moneyToSum: accountSum
        })
    }

    // añadir la cuenta con el restante
    let remaining = Decimal.sub(totalRemainingAmount, toSubtract).toNumber()
    outCuentas.push({
        instance: lastAccount.instance,
        name: lastAccount.name,
        after: lastAccount.currentTotal,
        before: Decimal.sum(lastAccount.currentTotal, remaining).toNumber(),
        moneyToSum: remaining
    })

    // devolver el resultado de todo
    return {
        totalExpenses: totalExpenses,
        expensesList: expenseData.expenseList,
        cuentas: outCuentas
    }    
}

/**
 * Función que recibe el resumen de los cambios y aplica la operación a las cuentas, devuelve el identificador de la operación realizada
 * 
 * Se debe recalcar que esta función considera que se ha introducido un input ideal y correcto, usa la salida de la otra función
 */
export async function aplyIngresarOperation(user: User, transactionResume: calculateExpenseImpactType, cashBundle: CashBundle, transaction: Transaction) {
    // recoger todas las cuentas
    let allAccounts: Cuenta[] = []
    
    // crear un grupo de transacción
    let transactionGroup = await TransactionsGroup.createWithUuid(transaction)

    // obtener cuenta de gastos
    let gastosAccount = await user.getExpensesAccount(transaction)
    allAccounts.push(gastosAccount)

    // registrar todos los gastos
    for (let gastoResume of transactionResume.expensesList) {
        // añadir balance a la cuenta de gastos
        gastosAccount.depositMoney(gastoResume.cost, transaction)

        // registrarlo como gasto
        let movimiento = await transactionGroup.createNewMovimiento(transaction)
        movimiento.setAsGasto(gastosAccount, gastoResume.type, gastoResume.name, gastoResume.cost)
        await movimiento.save({ transaction: transaction })
    }

    // añadir saldo a todas las cuentas y registrarlo en una transacción
    for (let cuentaResume of transactionResume.cuentas) {
        let cuenta = cuentaResume.instance
        let amount = cuentaResume.moneyToSum
        allAccounts.push(cuenta)

        // depositar
        cuenta.depositMoney(amount, transaction)

        // registrarlo como ingreso
        let movimiento = await transactionGroup.createNewMovimiento(transaction)
        movimiento.setAsIngreso(cuenta, amount)
        await movimiento.save({ transaction: transaction })
    }

    // obtener el pendiente del usuario
    let pendingMonto = await user.getPendingCash(transaction)

    // guardar registro de pending cash antiguo
    let beforePendingCash = CashBundle.importFromValidAcceptedCashValues(pendingMonto)

    // añadir metálico al pendiente del usuario
    // cashBundle.sumMonto(pendingMonto)
    pendingMonto.setFromCashBundle(new CashBundle().setFromValidAcceptedCashValues(cashBundle).sumMonto(pendingMonto))

    // redistribuir los billetes pendiente a las cuentas con dinero pendiente
    let operationLogs = await pendingMonto.reallocateCashToSubaccounts(user, allAccounts, transaction)
    await pendingMonto.save({ transaction: transaction })

    // guardar registro del  pending cash nuevo
    let afterPendingMonto = CashBundle.importFromValidAcceptedCashValues(pendingMonto)
    // console.log(`- antes: ${JSON.stringify(CashBundle.importFromValidAcceptedCashValues(beforePendingCash))}`)
    // console.log(`- después: ${JSON.stringify(CashBundle.importFromValidAcceptedCashValues(afterPendingMonto))}`)

    // filtrar las cuentas por la de gastos y las demás
    let cuentasOpetarionLogs = [] as [account: Cuenta, subAccount: Subcuenta, monto: Monto, beforeCash: CashBundle, afterCash: CashBundle][]
    let gastosAccountOperationLogs = [] as [account: Cuenta, subAccount: Subcuenta, monto: Monto, beforeCash: CashBundle, afterCash: CashBundle][]

    cuentasOpetarionLogs = operationLogs.filter(([ account, subAccount, monto, beforeCash, afterCash ]) => subAccount.cuenta !== gastosAccount.id)
    gastosAccountOperationLogs = operationLogs.filter(([ account, subAccount, monto, beforeCash, afterCash ]) => subAccount.cuenta === gastosAccount.id)

    return {
        transactionUuid: transactionGroup.uuid,
        beforePendingCash: beforePendingCash,
        afterPendingMonto: afterPendingMonto,
        cuentasOpetarionLogs: cuentasOpetarionLogs,
        gastosAccountOperationLogs: gastosAccountOperationLogs
    }
}