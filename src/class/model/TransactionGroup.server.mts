/**
 * Representa una serie de movimientos, simboliza una agrupación de acciones monetarias en el sistema
 */
import { Model, Transaction } from "sequelize"
import { Movimiento } from "@class/model/Movimiento.server.mts"

export class TransactionsGroup extends Model {
    declare id: number
    // el identificador a la que pertenece el movimiento (36 carácteres de longitud UUID)
    declare uuid: string
    declare transactionDate: Date
    declare description: string
    declare owner: number // el usuario al que pertenece el grupo de movimientos

    /**
     * Crea un nuevo movimiento para el grupo y lo devuelve
     */
    async createNewMovimiento(transaction?: Transaction): Promise<Movimiento> {
        return await Movimiento.create({
            transactionGroup: this.id
        }, { transaction: transaction })
    }

    /**
     * Devuelve todos los movimientos pertenecientes al grupo
     */
    async getMovimientos(): Promise<Movimiento[]> {
        return await Movimiento.findAll({
            where: {
                transactionGroup: this.id
            }
        })
    }
    
    /**
     * Devuelve una nueva instancia con un identificador único
     */
    static async createWithUuid(userId: number, transaction?: Transaction): Promise<TransactionsGroup> {
        let registerWithSameUuid: TransactionsGroup | null
        let newUuid: string

        // generar un nuevo UUID mientras exista en la base de datos
        do {
            newUuid = crypto.randomUUID()
            registerWithSameUuid = await TransactionsGroup.findOne({
                where: {
                    uuid: newUuid
                },
                transaction: transaction
            })
        } while (registerWithSameUuid)

        let transactionGroup = await TransactionsGroup.create({}, { transaction: transaction })
        transactionGroup.uuid = newUuid
        transactionGroup.owner = userId
        await transactionGroup.save({ transaction: transaction })
        return transactionGroup
    }
}