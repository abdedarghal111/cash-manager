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
import { Monto } from "@class/model/Monto.server.mts"



@Table({ tableName: 'subcuentas' })
export class Subcuenta extends Model {
    declare id: number
    declare name: string
    declare cuenta: number
    // el dinero total teniendo en cuenta metálico + pendiente
    declare total: number
    // el dinero que está en la subcuenta pero no en metálico
    declare cashPending: number
    // el monto asociado
    declare monto: number

    /**
     * devuelve el monto o crea uno nuevo
     */
    async getMonto(): Promise<Monto> {
        // obtener monto 
        let monto = await Monto.findByPk(this.monto)
        if (!monto) {
            // si no existe crearlo y inicializarlo
            monto = await Monto.create()
            this.monto = monto.id
            monto.clearCash()

            // guardar monto y la subcuenta
            await monto.save()
            await this.save()
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
}