/**
 * Clase Expense, contiene la descripción de un gasto
 */
import { TipoGasto } from "@data/enums/ExpenseType.mjs"
import { Model } from "sequelize"
import { Table } from "sequelize-typescript"
import { User } from "@class/model/User.server.mts"

/**
 * Enumeración para los tipos de gastos.
 */

@Table({ tableName: 'expenses' })
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
        let amountToPay = 0

        switch(this.type) {
            case TipoGasto.ANUAL:
                amountToPay = this.amount / 12
            break
            case TipoGasto.MENSUAL:
                amountToPay = this.amount
            break
        }

        return amountToPay
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
    static async getTotalMonthlyToPay(user: User): Promise<number> {
        // obtener todos los gastos
        const expenses = await Expense.findAll({
            where: {
                owner: user.id
            }
        })

        // obtener gastos totales a pagar
        let total = 0
        expenses.forEach(expense => {
            total += expense.getMontlyAmountToPay()
        })

        return Math.ceil(total * 100) / 100
    }
}