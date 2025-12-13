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
}