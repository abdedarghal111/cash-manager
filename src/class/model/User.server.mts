/**
 * Clase usuario, contiene la descripción de un usuario sincronizado con la base de datos (DatabaseController).
 */
import { Model, Transaction } from "sequelize"
import { Table } from "sequelize-typescript"
import { Monto } from "@class/model/Monto.server.mts"
import { Cuenta } from "@class/model/Cuenta.server.mts"

@Table({ tableName: 'users' })
export class User extends Model {
    declare id: number
    declare username: string
    declare password: string

    /**
     * SaldoPendiente, se encarga de tener la cuenta del saldo pendiente por falta de efectivo exacto.
     * 
     * Por ejemplo si solo existe un billete y hay que repartirlo, el billete queda en este monto hasta que exista
     * suficiente efectivo para repartirlo sin dividirlo.
     */
    declare pendingMonto: number

    // cuenta /dev/null (a donde van los gastos)
    declare nullAccount: number

    /**
     * Crea la el metálico pendiente si no existe y lo devuelve
     * 
     * @returns {Promise<Monto>} El metálico pendiente
     */
    async getPendingCash(transaction?: Transaction): Promise<Monto> {
        let montoPendiente = await Monto.findByPk(this.pendingMonto, { transaction: transaction })
        // si no existe el metálico pendiente crearlo
        if (!montoPendiente) {
            montoPendiente = await Monto.create({}, { transaction: transaction })
            montoPendiente.clearCash()
            await montoPendiente.save({ transaction: transaction })

            // guardar el id del metálico pendiente en el usuario
            this.pendingMonto = montoPendiente.id
            await this.save({ transaction: transaction })
        }
        
        return montoPendiente
    }

    /**
     * Crea la cuenta a donde van los gastos (cuenta /dev/null)
     * 
     * @returns {Promise<Cuenta>} La cuenta correspondiente
     */
    async getExpensesAccount(transaction?: Transaction): Promise<Cuenta> {
        let cuentaGastos = await Cuenta.findByPk(this.nullAccount, { transaction: transaction })
        // si no existe la cuenta se crea
        if (!cuentaGastos) {
            cuentaGastos = await Cuenta.create({}, { transaction: transaction })
            cuentaGastos.name = this.getExpensesAccountName()
            cuentaGastos.ignore = true // para ser ignorada
            cuentaGastos.percentage = 0
            cuentaGastos.isRemainder = false
            await cuentaGastos.save({ transaction: transaction })

            // guardar el id de la cuenta correspondiente en el usuario
            this.nullAccount = cuentaGastos.id
            await this.save({ transaction: transaction })
        }
        
        return cuentaGastos
    }

    /**
     * Nombre de la cuenta a donde van los gastos (cuenta /dev/null) (para estar en un solo sitio)
     */
    getExpensesAccountName(): string {
        return "Cuenta de gastos"
    }

    /***
     * Simplemente devuelve el nombre que se le ha concedido al monto pendiente (para estar en un solo sitio)
     */
    getPendingCashName(): string {
        return "Metálico pendiente"
    }
}