/**
 * Clase Cuenta, representa una cuenta que contendrá varias subcuentas y que pertenecerá a un usuario.
 */

import { Model } from "sequelize"
import { Table } from "sequelize-typescript"

@Table({ tableName: 'cuentas' })
export class Cuenta extends Model {
    declare id: number
    declare name: string
    declare owner: number
}