/**
 * Clase SaldoPendiente, se encarga de tener la cuenta del saldo pendiente por falta de efectivo exacto.
 * 
 * Por ejemplo si solo existe un billete y hay que repartirlo, el billete queda en esta subcuenta hasta que exista
 * suficiente efectivo para repartirlo sin dividirlo.
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

@Table({ tableName: 'saldospendientes' })
export class SaldoPendiente extends Model {
    declare id: number

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