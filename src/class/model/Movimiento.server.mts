import { Model } from "sequelize"

export enum TipoMovimiento {
    INGRESO = 'ingreso',
    GASTO = 'gasto',
    EXTRACCION = 'extraccion',
    MOVIMIENTO = 'movimiento'
}

export class Movimiento extends Model {
    declare id: number
    // la transaccion a la que pertenece el movimiento (36 carácteres de longitud UUID)
    declare transactionGroupUid: number
    declare transactionDate: Date
    // si está vacía es porque es un ingreso y si también toCuenta está vacía es que es un gasto
    declare fromCuenta: number | null
    // si está vacía es porque es una extracción
    declare toCuenta: number | null
    declare monto: number
    declare type: TipoMovimiento
    // el concepto del movimiento:
    declare description: string

    /**
     * Devuelve un identificador único para asignarlo a movimientos
     */
    async getUniqueId(): Promise<string> {
        let movimientoWithId: Movimiento | null
        let newUid: string

        // generar un nuevo UUID mientras exista en la base de datos
        do {
            newUid = crypto.randomUUID()
            movimientoWithId = await Movimiento.findOne({
                where: {
                    transactionGroupUid: newUid
                }
            })
        } while (movimientoWithId)

        return newUid
    }
}