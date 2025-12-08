import { Model } from "sequelize";

export enum TipoMovimiento {
    INGRESO = 'ingreso',
    GASTO = 'gasto',
    EXTRACCION = 'extraccion',
    MOVIMIENTO = 'movimiento'
}

export class Movimiento extends Model {
    declare id: number;
    declare cuentaId: number;
    declare amount: number;
    declare type: TipoMovimiento;
    // el concepto del movimiento:
    declare description: string;
}