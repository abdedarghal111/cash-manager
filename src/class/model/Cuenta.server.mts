/**
 * Clase Cuenta, representa una cuenta que contendrá varias subcuentas y que pertenecerá a un usuario.
 */
import { Model, Transaction } from "sequelize"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { User } from "@class/model/User.server.mts"
import Decimal from "decimal.js"
import { Movimiento } from "@class/model/Movimiento.server.mts"
import { TipoMovimiento } from "@data/enums/MovimientoType.mjs"
import { TransactionsGroup } from "@class/model/TransactionGroup.server.mts"

export type PercentageFormattedCuentas = {
    instance: Cuenta, 
    name: string, 
    percentage: number,
    currentTotal: number
}[]

export class Cuenta extends Model {
    declare id: number
    declare name: string
    declare owner: number
    declare percentage: number
    declare isRemainder: boolean
    // si está en true, la cuenta no será mostrada ni usada por defecto
    declare ignore: boolean

    /**
     * Calcula el balance total de la cuenta sumando los montos de sus subcuentas.
     * @returns El balance total.
     */
    async getTotal(): Promise<number> {
        // recoger subcuentas
        const subcuentas = await Subcuenta.findAll({
            where: {
                cuenta: this.id
            }
        })

        // calcular todos los totales
        let total = new Decimal(0)
        for (const subcuenta of subcuentas) {
            total = total.add(subcuenta.total || 0)
        }

        return total.toNumber()
    }

    /**
     * Devuelve la primera subcuenta no llena de la cuenta o la crea
     */
    async getAvalibleSubcuenta(transaction?: Transaction): Promise<Subcuenta> {
        let subcuentaLibre = await Subcuenta.findOne({
            where: {
                cuenta: this.id,
                isFilled: false
            },
            transaction: transaction
        })

        // si no existe subcuenta libre entonces crearla
        if (!subcuentaLibre) {
            subcuentaLibre = await Subcuenta.create({}, { transaction: transaction })
            subcuentaLibre.cuenta = this.id
            subcuentaLibre.name = subcuentaLibre.getSubcuentacode()
            subcuentaLibre.save({ transaction: transaction })
        }

        return subcuentaLibre
    }

    /**
     * Deposita dinero en total pendiente en la cuenta
     * 
     * @throws {Error} si ocurre un error al depositar dinero en la subcuenta.
     */
    async depositMoney(amount: number, transaction?: Transaction): Promise<void> {
        let remaining = new Decimal(amount)

        // mientras exista remaining
        do {
            // obtener una subcuenta disponible
            let subcuenta = await this.getAvalibleSubcuenta(transaction)
            // obtener su máximo
            let maxAcceptedDeposit = subcuenta.getMaxAcceptedDeposit()
            // calcular el dinero que se puede instroducir
            let canPut = Math.min(remaining.toNumber(), maxAcceptedDeposit)
            // poner el put y restar a remaining
            if (!subcuenta.depositPendiente(canPut)) {
                throw new Error("Error al depositar dinero en la subcuenta.") // linea que no se debe ejecutar
            }
            remaining = remaining.sub(canPut)
            // guardar subcuenta
            subcuenta.save({ transaction: transaction })
        } while(remaining.toNumber() !== 0);
    }

    /**
     * Quita el isRemainder a todas las cuentas que pertenecen al mismo usuario.
     * @returns Una promesa que se resuelve cuando se han quitado los isRemainder.
     */
    static async removeAllIsRemainderForUser(userId: number): Promise<void> {
        await Cuenta.update(
            { 
                isRemainder: false 
            },
            {
                where: {
                    owner: userId,
                    isRemainder: true
                }
            }
        )
    }

    /**
     * Elimina el porcentaje excesivo de las cuentas aplicando un margen extra
     * para poder añadir otra cuenta, empieza eliminando el margen de las cuentas
     * con más porcentaje.
     * @returns Una promesa que se resuelve cuando se han quitado los isRemainder.
     */
    static async removeExcessMarginFromUser(userId: number, margin: number): Promise<void> {
        // obtener todas las cuentas
        const userAccounts = await Cuenta.findAll({
            where: {
                owner: userId,
                ignore: false
            },
            order: [['percentage', 'DESC']]
        })
        
        // contar el porcentaje de todas las cuentas
        let totalPercentage = 0
        for (const acc of userAccounts) {
            totalPercentage += acc.percentage
        }

        // si el porcentaje + el exceso supera 100 entonces restar el exceso a las cuentas
        if (totalPercentage + margin <= 100) {
            return
        }

        // eliminar el exceso de porcentaje
        let exceso = margin
        for (const acc of userAccounts) {
            // restar al exceso el porcentaje de la cuenta
            exceso -= acc.percentage
            acc.percentage = 0
            // si el exceso es negativo entonces devolver el exceso a la cuenta y salir
            if (exceso < 0) {
                acc.percentage -= exceso // el exceso es negativo por lo que hay que restarlo para que se sume
                await acc.save()
                return
            }
            // guardar la cuenta
            await acc.save()
        }
    }

    /**
     * Devuelve las cuentas dado su porcentaje, id y nombre para un usuario
     * La cuenta remainder la deja para el final con un porcentaje -1
     */
    static async getAllPercentageFormatted(user: User): Promise<PercentageFormattedCuentas> {
        const userAccounts = await Cuenta.findAll({
            where: {
                owner: user.id,
                ignore: false
            },
            order: [['percentage', 'DESC']]
        })

        // recoger todas las subcuentas
        let cleanAccounts: PercentageFormattedCuentas = []
        let remainderAccount: false|Cuenta = false
        for (let account of userAccounts) {
            if (account.isRemainder) {
                // si es restante entonces guardarla para el final
                remainderAccount = account
            } else {
                // guardar cuenta en la lista
                cleanAccounts.push({
                    instance: account,
                    name: account.name,
                    percentage: account.percentage,
                    currentTotal: await account.getTotal()
                })
            }
        }

        // si existe cuenta con remainder entonces añadirla al final con -1 y devolverla
        if (remainderAccount) {
            remainderAccount = remainderAccount as Cuenta
            cleanAccounts.unshift({
                instance: remainderAccount,
                name: remainderAccount.name,
                percentage: -1,
                currentTotal: await remainderAccount.getTotal()
            })
        }

        return cleanAccounts
    }
}