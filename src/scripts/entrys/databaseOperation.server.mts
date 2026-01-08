/**
 * Script de para hacer movimientos con la base de datos
 */
import { DatabaseController } from '@single/DatabaseController.server.mjs'
import { type EntryType, prompt } from '../main.server.mts'
import 'colors'
import { Monto } from '@class/model/Monto.server.mjs'
import { CashBundle } from '@class/CashBundle.mjs'
import { Validator } from '@single/Validator.mjs'
import { Subcuenta } from '@class/model/Subcuenta.server.mjs'

let actions = [
    ['Poner a cero los montos', async (rl) => {
        await Monto.update(
            new CashBundle().exportToAcceptedCashValues(), // genera una tabla con ceros todos para que actualice todo a 0
            {where: {}}
        ) // update all

        await Subcuenta.update({
            total: 0,
            cashPending: 0
        }, {where: {}}) // actualizar todas

        return {
            success: true,
            message: 'Todos los montos han sido puestos a cero.'.green
        }
    }]
] as [string, EntryType][]

export const main: EntryType = async (rl) => {

    // mostrar las "actions disponibles"
    console.log('Acciones disponibles:'.cyan)
    actions.forEach(([actionName, action], index) => {
        console.log(`- ${index + 1}: ${actionName}`.green)
    })

    // preguntar por acción a ejecutar
    let answer = await prompt('Introduce el número de la acción que quieres realizar: '.yellow)
    
    // validar que es un número
    let index = Validator.parseInt(answer.trim())
    
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
    if (index < 0 || index >= actions.length) {
        console.log('Selección inválida.'.red)
        return {
            success: false,
            message: 'Selección inválida'
        }
    }

    let actionName = actions[index]![0]
    let action = actions[index]![1]

    // preguntar al usuario si está seguro de la acción
    let response = await prompt(`¿Estás seguro que lo quieres realizar? Esta acción no se puede deshacer. [si/no]: `.red)

    // si la respuesta no es si, entonces retroceder
    if (response.toLocaleLowerCase() !== 'si') {
        return {
            success: false,
            message: 'Operación cancelada'
        }
    }

    // realizar acción y devolver resultado
    return await action(rl)
}