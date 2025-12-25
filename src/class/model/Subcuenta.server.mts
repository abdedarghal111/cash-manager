/**
 * Clase Subcuenta, se encarga de tener las cuentas que pertenecen a cada cuenta.
 * 
 * Tiene las cuentas de los billetes y el dinero pendiente, el dinero pendiente está en una cuenta especial.
 * Son billetes que han sobrado pero que sus dividendos pertenecen a las diferentes subcuentas.
 * 
 * Es importante considerar que en este contexto subcuenta se refiere literalmente a un monto de dinero
 * que tendrá un límite máximo especificado en la configuración.
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

// tipos para el metálico aceptado por el servidor (establecer un standart)
export interface AcceptedCashValues {
    cincuenta: number
    veinte: number
    diez: number
    cinco: number
    dos: number
    uno: number
    cerocincuenta: number
    ceroveinte: number
    cerodiez: number
    cerocinco: number
    cerodos: number
    cerouno: number
}

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
    declare dos: number
    declare uno: number
    declare cerocincuenta: number
    declare ceroveinte: number
    declare cerodiez: number
    declare cerocinco: number
    declare cerodos: number
    declare cerouno: number

    /**
     * pone a cero el dinero en metálico y los totales de la subcuenta
     */
    clearCash(): void {
        this.total = 0
        this.cashPending = 0
        this.cincuenta = 0
        this.veinte = 0
        this.diez = 0
        this.cinco = 0
        this.dos = 0
        this.uno = 0
        this.cerocincuenta = 0
        this.ceroveinte = 0
        this.cerodiez = 0
        this.cerocinco = 0
        this.cerodos = 0
        this.cerouno = 0
    }
}