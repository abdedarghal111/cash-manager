/**
 * Clase Subcuenta, se encarga de tener las cuentas que pertenecen a cada cuenta.
 * 
 * Tiene las cuentas de los billetes y el dinero pendiente, el dinero pendiente está en una cuenta especial.
 * Son billetes que han sobrado pero que sus dividendos pertenecen a las diferentes subcuentas.
 * 
 * Es importante considerar que en este contexto subcuenta se refiere literalmente a un monto de dinero
 * que tendrá un límite máximo especificado en la configuración.
 */
import { Model, Transaction } from "sequelize"
import { Table } from "sequelize-typescript"
import { Monto } from "@class/model/Monto.server.mts"
import Decimal from "decimal.js"



@Table({ tableName: 'subcuentas' })
export class Subcuenta extends Model {
    declare id: number
    declare name: string // puede resultar contraintuitivo pero el nombre es el código de la subcuenta
    declare cuenta: number
    // el dinero total teniendo en cuenta metálico + pendiente
    declare total: number
    // el dinero que está en la subcuenta pero no en metálico
    declare cashPending: number
    // el monto asociado
    declare monto: number
    // el máximo de la subcuenta (establecido a 20.000 en la base de datos)
    declare maxMoney: number
    // si la cuenta está llena o ha alcanzado el umbral de MaxMoney
    declare isFilled: boolean

    /**
     * devuelve el monto o crea uno nuevo
     */
    async getMonto(transaction?: Transaction): Promise<Monto> {
        // obtener monto 
        let monto = await Monto.findByPk(this.monto, { transaction: transaction })
        if (!monto) {
            // si no existe crearlo y inicializarlo
            monto = await Monto.create({}, { transaction: transaction })
            this.monto = monto.id
            monto.clearCash()

            // guardar monto y la subcuenta
            await monto.save({ transaction: transaction })
            await this.save({ transaction: transaction })
        }

        return monto
    }
    
    /**
     * pone a cero los totales de la subcuenta y guarda la subcuenta y el monto correspondiente
     */
    async clearCash(): Promise<void> {
        this.total = 0
        this.cashPending = 0

        let monto = await this.getMonto()
        monto.clearCash()

        // guardar monto y subcuenta
        await monto.save()
        await this.save()
    }

    /**
     * devuelve un identificador especialmente creado para la subcuenta
     * 
     * lo devuelve como `${cuenta.id}-${subcuenta.id}`
     */
    getSubcuentacode(): string {
        return `${this.cuenta}-${this.id}`
    }

    /**
     * Devuelve la cantidad máxima de dinero que se le puede ingresar
     */
    getMaxAcceptedDeposit(): number {
        let avalible = new Decimal(0)

        return avalible.add(this.maxMoney).sub(this.total).toNumber()
    }

    /**
     * Deposita al total pendiente si es posible, devuelve false si no se pudo
     */
    depositPendiente(cuantity: number) {
        let newTotal = new Decimal(this.total).add(cuantity)

        // si sumando las cantidades se supera el máximo entonces devolver false
        if (newTotal.toNumber() > this.maxMoney) {
            return false
        } else {
            // sumar la cantidad y devolver
            this.total = newTotal.toNumber()
            // sumar al total pendiente la cantidad
            this.cashPending = new Decimal(this.cashPending).add(cuantity).toNumber()
            return true
        }
    }
}