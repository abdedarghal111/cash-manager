/**
 * Clase Expense, contiene la descripción de un gasto
 */
import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

/**
 * Enumeración para los tipos de gastos.
 */
export enum TipoGasto {
    ANUAL = 'anual',
    MENSUAL = 'mensual'
}

@Table({ tableName: 'expenses' })
export class Expense extends Model {
    declare id: number
    declare owner: number
    declare type: TipoGasto
    declare amount: number
}