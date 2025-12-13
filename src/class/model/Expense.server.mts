/**
 * Clase Expense, contiene la descripción de un gasto
 */
import { TipoGasto } from "@data/ExpenseType.mjs"
import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

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
     * Función que devuelve si el string introducido es un tipo de gasto válido.
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
}