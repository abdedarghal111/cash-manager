/**
 * Contiene la enumeración de los tipos de movimientos y sus standares
 * 
 * Hecho con el propósito de permitir al cliente acceder a los tipos de gastos
 */
export enum TipoMovimiento {
    // cuando se ingresa dinero a una cuenta, se rellena toCuenta y la cantidad
    INGRESO = 'ingreso',
    // cuando va a la cuenta de gastos, dinero que se consume o está destinado a desaparecer, se rellena toCuenta, la cantidad y el tipoGasto y gastoName
    GASTO = 'gasto',
    // dinero que desaparece del cómputo, se rellena fromCuenta, la cantidad y el concepto
    EXTRACCION = 'extraccion',
    // dinero que se mueve de una cuenta a la otra, se rellena fromCuenta, toCuenta y la cantidad
    MOVIMIENTO = 'movimiento'
}