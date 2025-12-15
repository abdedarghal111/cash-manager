/**
 * Clase Cuenta, representa una cuenta que contendrá varias subcuentas y que pertenecerá a un usuario.
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"
import { Subcuenta } from "./Subcuenta.server.mjs"

@Table({ tableName: 'cuentas' })
export class Cuenta extends Model {
    declare id: number
    declare name: string
    declare owner: number
    declare percentage: number
    declare isRemainder: boolean

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
        let total = 0
        for (const subcuenta of subcuentas) {
            total += subcuenta.total || 0
        }

        return total
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
                owner: userId
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
}