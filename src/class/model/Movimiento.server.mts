/**
 * El movimiento atómico, simboliza una acción monetaria en el sistema
 * Siempre va dentro de un TransactionGroup
 */
import { TipoGasto } from "@data/enums/ExpenseType.mjs"
import { TipoMovimiento } from "@data/enums/MovimientoType.mjs"
import { Model } from "sequelize"
import { Cuenta } from "@class/model/Cuenta.server.mts"
import { Expense } from "@class/model/Expense.server.mts"
import { User } from "@class/model/User.server.mts"

export class Movimiento extends Model {
    declare id: number
    // foreignkey del grupo de la transacción
    declare transactionGroup: number
    // si está vacía es porque es un ingreso y si también toCuenta está vacía es que es un gasto
    declare fromCuenta: number | null
    // si está vacía es porque es una extracción
    declare toCuenta: number | null
    declare cantidad: number
    // definidos los tipos de movimientos en MovimientoType.mts
    declare type: TipoMovimiento
    // en caso de que sea un gasto registrar nombre y tipo, la cantidad representa el coste del gasto
    declare gastoName: string
    declare tipoGasto: TipoGasto
    // el concepto del movimiento:
    declare description: string

    /**
     * Modifica los campos de la transacción para registrarla como un ingreso
     */
    setAsIngreso(account: Cuenta, amount: number) {
        this.type = TipoMovimiento.INGRESO
        this.fromCuenta = null
        this.toCuenta = account.id
        this.cantidad = amount
    }

    /**
     * Modifica los campos de la transacción para registrarla como un gasto (va a la cuenta de gastos del usuario)
     */
    setAsGasto(expensesAccount: Cuenta, tipoGasto: TipoGasto, gastoName: string, amount: number) {
        this.type = TipoMovimiento.GASTO
        this.fromCuenta = null
        this.toCuenta = expensesAccount.id
        this.gastoName = gastoName
        this.tipoGasto = tipoGasto
        this.cantidad = amount
    }

    /**
     * Modifica los campos de la transacción para registrarla como un gasto (va a la cuenta de gastos del usuario)
     */
    setAsExtraccion(extractionAccount: Cuenta, cuantity: number, description: string) {
        this.type = TipoMovimiento.EXTRACCION
        this.fromCuenta = extractionAccount.id
        this.toCuenta = null
        this.cantidad = cuantity
        this.description = description
    }
    
}