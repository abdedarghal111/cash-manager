/**
 * Clase Subcuenta, se encarga de tener las cuentas que pertenecen a cada cuenta.
 * 
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

@Table({ tableName: 'subcuentas' })
export class Subcuenta extends Model {
    declare id: number
    declare name: string
    declare cuenta: number

    // metálico
    declare cincuenta: number
    declare veinte: number
    declare diez: number
    declare cinco: number
    declare uno: number
    declare cerocincuenta: number
    declare ceroveinte: number
    declare cerodiez: number
    declare cerocinco: number
    declare cerodos: number
    declare cerouno: number
}