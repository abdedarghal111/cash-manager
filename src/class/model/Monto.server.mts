/**
 * Clase Monto, representa un monto o conjunto de dinero 
 */
import { CashBundle } from "@class/CashBundle.mjs"
import { AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"
import { Model } from "sequelize"
import { Table } from "sequelize-typescript"


@Table({ tableName: 'montos' })
export class Monto extends Model implements AcceptedCashValues {
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

    /**
     * Establecer el monto de un cashBundle a este monto
     */
    setFromCashBundle(bundle: CashBundle): void {
        this.cincuenta = bundle.cincuenta
        this.veinte = bundle.veinte
        this.diez = bundle.diez
        this.cinco = bundle.cinco
        this.dos = bundle.dos
        this.uno = bundle.uno
        this.cerocincuenta = bundle.cerocincuenta
        this.ceroveinte = bundle.ceroveinte
        this.cerodiez = bundle.cerodiez
        this.cerocinco = bundle.cerocinco
        this.cerodos = bundle.cerodos
        this.cerouno = bundle.cerouno
    }
}