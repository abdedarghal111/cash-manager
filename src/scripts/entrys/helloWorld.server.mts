/**
 * Script de prueba para ver si funciona correctamente
 */
import type { EntryType } from '../main.server.mts'
import 'colors'

export const main: EntryType = async (rl) => {

    // imprimir hola mundo
    console.log(`Hello, world!`)

    // devolver el mensaje
    return {
        success: true,
        message: 'Ejecutado correctamente'
    }
}