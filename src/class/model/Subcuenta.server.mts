/**
 * Clase Subcuenta, se encarga de tener las cuentas que pertenecen a cada cuenta.
 * 
 * Tiene las cuentas de los billetes y el dinero pendiente, el dinero pendiente está en una cuenta especial.
 * Son billetes que han sobrado pero que sus dividendos pertenecen a las diferentes subcuentas.
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

@Table({ tableName: 'subcuentas' })
export class Subcuenta extends Model {
    declare id: number
    declare name: string
    declare cuenta: number
    // el dinero total teniendo en cuenta metálico + pendiente
    declare total: number
    // el dinero que está en la subcuenta pero no en metálico
    declare cashPending: number

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