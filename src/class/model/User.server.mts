/**
 * Clase usuario, contiene la descripción de un usuario sincronizado con la base de datos (DatabaseController).
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"
import { SaldoPendiente } from "@class/model/SaldoPendiente.server.mts"

@Table({ tableName: 'users' })
export class User extends Model {
    declare id: number
    declare username: string
    declare password: string
    declare pendingCashKey: number

    /**
     * Crea la el metálico pendiente si no existe y lo devuelve
     * 
     * @returns {Promise<SaldoPendiente>} El metálico pendiente
     */
    async getPendingCash(): Promise<SaldoPendiente> {
        let saldoPendiente = await SaldoPendiente.findByPk(this.pendingCashKey)
        // si no existe el metálico pendiente crearlo
        if (!saldoPendiente) {
            saldoPendiente = await SaldoPendiente.create()
            saldoPendiente.clearCash()
            await saldoPendiente.save()

            // guardar el id del metálico pendiente en el usuario
            this.pendingCashKey = saldoPendiente.id
            await this.save()
        }
        
        return saldoPendiente
    }

}