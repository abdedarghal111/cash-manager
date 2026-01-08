/**
 * Script de para eliminar todos los registros de la base de datos
 */
import { DatabaseController } from '@single/DatabaseController.server.mjs'
import { type EntryType, prompt } from '../main.server.mts'
import 'colors'

export const main: EntryType = async (rl) => {

    // preguntar al usuario si está seguro de borrar todos los datos
    let response = await prompt(`¿Estás seguro de que quieres eliminar todos los registros de la base de datos? Esta acción no se puede deshacer. [si/no]: `.red)

    // si la respuesta no es si, entonces retroceder
    if (response.toLocaleLowerCase() !== 'si') {
        console.log('Operación cancelada.'.yellow)
        return {
            success: false,
            message: 'Operación cancelada'
        }
    }

    // obtener sequelize
    let sequelize = DatabaseController.sequelize

    // el force true hace que dropee todas las tablas
    await sequelize.sync({ force: true })

    // devolver el mensaje
    return {
        success: true,
        message: 'Base de datos borrada'
    }
}