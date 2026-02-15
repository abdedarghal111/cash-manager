/**
 * Clase Expense, contiene la descripción de un gasto
 */
import { TipoGasto } from "@data/enums/ExpenseType.mjs"
import { Model } from "sequelize"
import { User } from "@class/model/User.server.mts"
import Decimal from "decimal.js"

export interface TotalMonthlyToPayType {
    totalExpenses: number
    expenseList: {
        name: string
        cost: number
        type: TipoGasto
    }[]
}

export class Expense extends Model {
    declare id: number
    declare owner: number
    declare name: string
    declare type: TipoGasto
    declare amount: number

    /**
     * Devuelve el gasto a pagar según su tipo (se considera que vas a pagar una mensualidad)
     */
    getMontlyAmountToPay(): number {
        let amountToPay = new Decimal(this.amount)

        switch(this.type) {
            case TipoGasto.ANUAL:
                amountToPay = amountToPay.div(12)
            break
            case TipoGasto.MENSUAL:
                // no hacer nada
            break
        }

        // dejar dos decimales
        return amountToPay.mul(100).round().div(100).toNumber() 
    }

    /**
     * Devuelve si el string introducido es un tipo de gasto válido.
     * @param string Tipo de gasto a comprobar.
     * @returns bool Verdadero si es un tipo de gasto valido, Falso si no lo es.
     */
    static isValidType(str: string): boolean {
        // comprobar si el string introducido es un tipo de gasto
        for (let tipo in TipoGasto) {
            // @ts-ignore Typescript borracho
            if (TipoGasto[tipo] === str) {
                return true
            }
        }

        // si no es un tipo de gasto valido
        return false
    }

    /**
     * Devuelve el total de gastos a pagar para un usuario mensualmente (con dos decimales)
     * 
     * @returns number Total de gastos a pagar para el usuario.
     */
    static async getTotalMonthlyToPayResume(user: User): Promise<TotalMonthlyToPayType> {
        // obtener todos los gastos
        const expenses = await Expense.findAll({
            where: {
                owner: user.id
            }
        })

        // crear la lista para añadir cada gasto
        let expenseList = [] as TotalMonthlyToPayType["expenseList"]

        // obtener gastos totales a pagar
        let total: Decimal = new Decimal(0)
        expenses.forEach(expense => {
            // sumar al total la cantidad mensual a pagar
            let montlyToPay = expense.getMontlyAmountToPay()

            total = total.add(montlyToPay)
            expenseList.push({
                name: expense.name,
                cost: montlyToPay,
                type: expense.type
            })
        })

        // devolver el número redondeado con dos decimales a la alza
        return {
            totalExpenses: total.mul(100).ceil().div(100).toNumber(),
            expenseList: expenseList
        }
    }
}