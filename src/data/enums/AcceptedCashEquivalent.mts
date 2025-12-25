/**
 * Tabla con la key en string y su valor como número y monetario
 * @see AcceptedCashValues
 */

import type { AcceptedCashValues } from "@class/model/Subcuenta.server.mjs";

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