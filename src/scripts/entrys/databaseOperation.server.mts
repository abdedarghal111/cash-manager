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
import { User } from '@class/model/User.server.mjs'
import { validIndexNumber as validIndexEntry } from '../scriptUtils.server.mts'
import { Cuenta } from '@class/model/Cuenta.server.mjs'
import { TransactionsGroup } from '@class/model/TransactionGroup.server.mjs'
import { Movimiento } from '@class/model/Movimiento.server.mjs'

let actions = [
    ['Poner a cero los montos', async (rl) => {
        await Monto.update(
            new CashBundle().exportToAcceptedCashValues(), // genera una tabla con ceros todos para que actualice todo a 0
            { where: {} }
        ) // update all

        await Subcuenta.update({
            total: 0,
            cashPending: 0
        }, { where: {} }) // actualizar todas

        return {
            success: true,
            message: 'Todos los montos han sido puestos a cero.'.green
        }
    }],
    ['Borrar Base de datos', async (rl) => {
        // preguntar al usuario si está seguro de borrar todos los datos
        let response = await prompt(`¿Seguro segurisimo de que quieres eliminar todos los registros de la base de datos? Esta acción no se puede deshacer. [si/no]: `.red)

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
    }],
    ['Eliminar información de cuentas de un usuario', async (rl) => {
        // recoger usuarios y imprimirlos
        let users = await User.findAll()
        users.forEach((user, index) => {
            console.log(`- ${index + 1}: ${user.username}`.green)
        })
        
        if (users.length === 0) {
            return {
                success: false,
                message: 'No hay usuarios registrados.'.yellow
            }
        }

        // preguntar por acción a ejecutar
        let answer = await prompt('Elige el usuario al que aplicarle esta acción: '.yellow)
        // validar que es un número
        let index = validIndexEntry(answer.trim(), users.length)
        if (typeof index !== 'number') {
            return index // inválido
        }

        let user = users[index]!
        console.log(`Seleccionado ${user.username}`)

        // borrar historial del usuario primero
        let transactionsGroup = await TransactionsGroup.findAll({
            where: { owner: user.id }
        })
        for (let group of transactionsGroup) {
            let movimientos = await Movimiento.findAll({ where: { transactionGroup: group.id }})
            for (let mov of movimientos) {
                await mov.destroy()
            }
            await group.destroy()
        }
        console.log(`Historial de movimientos de ${user.username} eliminado.`.white)

        // Colocar pending monto a cero
        let pendingCash = await user.getPendingCash()
        pendingCash.clearCash()
        await pendingCash.save()
        console.log(`Monto pendiente de ${user.username} puesto a cero.`.white)

        // eliminar montos y subcuentas del usuario
        let cuentas = await Cuenta.findAll({
            where: { owner: user.id }
        })
        cuentas.push(await user.getExpensesAccount()) // también la de gastos
        for (let cuenta of cuentas) {
            let subAccs = await Subcuenta.findAll({ where: { cuenta: cuenta.id } })
            for (let subacc of subAccs) {
                let monto = await subacc.getMonto()
                await monto.destroy()
                await subacc.destroy()
            }
        }
        console.log(`Subcuentas y montos de ${user.username} eliminados.`.white)


        return {
            success: true,
            message: `Datos de cuentas de ${user.username} eliminados correctamente`.green
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
    let index = validIndexEntry(answer.trim(), actions.length)
    if (typeof index !== 'number') {
        return index // inválido
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