/**
 * Utilidad para reciclar código de scripts
 */
import { Validator } from "@single/Validator.mjs"

/**
 * 1. Comprueba si un index es un número válido pasado como string
 * 2. Le suma uno al index si es válido
 * 3. compruba que index < min y index >= max
 * 
 * Devuelve el error indicado o el índex si está correcto
 */
export function validIndexNumber(strIndex: string, max: number, min = 0) {
    // validar que es un número
    let index = Validator.parseInt(strIndex)

    if (Validator.isNotValid(index)) {
        console.log('Entrada inválida.'.red)
        return {
            success: false,
            message: 'Entrada inválida'
        }
    }

    // normalizar a la lista [de 0 a n]
    index -= 1

    // indicar la que ha seleccionado:
    if (index < min || index >= max) {
        console.log('Selección inválida.'.red)
        return {
            success: false,
            message: 'Selección inválida'
        }
    }

    // devolver el index si está correcto
    return index
}