/**
 * Tabla con la key en string y su valor como número y monetario
 * @see AcceptedCashValues
 */

// tipos para el metálico aceptado por el servidor (establecer un standart)
export interface AcceptedCashValues {
    cincuenta: number
    veinte: number
    diez: number
    cinco: number
    dos: number
    uno: number
    cerocincuenta: number
    ceroveinte: number
    cerodiez: number
    cerocinco: number
    cerodos: number
    cerouno: number
}

export const AcceptedCashEquivalent: AcceptedCashValues = {
    cincuenta: 50,
    veinte: 20,
    diez: 10,
    cinco: 5,
    dos: 2,
    uno: 1,
    cerocincuenta: 0.5,
    ceroveinte: 0.2,
    cerodiez: 0.1,
    cerocinco: 0.05,
    cerodos: 0.02,
    cerouno: 0.01,
}

// dos arrays diferentes pero en el mismo orden (keys por un lado y values por otro)
export const validCashValues = Object.values(AcceptedCashEquivalent) as number[]
export const validCashStrings = Object.keys(AcceptedCashEquivalent) as (keyof AcceptedCashValues)[]