/**
 * Clase usuario, contiene la descripción de un usuario sincronizado con la base de datos (DatabaseController).
 */

import { Model } from "sequelize";
import { Table } from "sequelize-typescript";

@Table({ tableName: 'users' })
export class User extends Model {
    declare id: number;
    declare username: string;
    declare password: string;
}