/**
 * Entrada main para ejecutar scripts y alterar los datos del programa
 */
import { createInterface, Interface } from 'readline'
import 'colors'
import { Validator } from '@single/Validator.mjs'
import { main as helloWorldEntry } from './entrys/helloWorld.server.mjs'
import { main as databaseOperationEntry } from './entrys/databaseOperation.server.mjs'
import { main as createDotEnvEntry } from './entrys/createDotEnv.server.mjs'

// estandarizar tipo de entrada/salida aceptada
export type EntryType = (rl: Interface) => Promise<{
    success: boolean
    message: string
}>

// entradas para cada script
const scriptsLibrary = {
    'Hello world': helloWorldEntry,
    'Operaciones con la base de datos': databaseOperationEntry,
    'Copiar y pegar .env': createDotEnvEntry
} as {
    [key: string]: EntryType
}

// crea una promesa para poder usar await
export let prompt = async (questionText: string): Promise<string> => {
    // devolver la respuesta cuando se resuelva
    return new Promise((resolve, reject) => {
        rl.question(questionText, (input) => resolve(input))
    })
}


// separar por sus keys y sus entradas
const scriptsKeys = Object.keys(scriptsLibrary)
const scriptsEntrys = Object.values(scriptsLibrary)

// mostrar los scripts disponibles
console.log('Scripts disponibles:'.cyan)
scriptsKeys.forEach((name, index) => {
    console.log(`- ${index + 1}: ${name}`.green)
})

// crear objeto readline
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
})

// manejo de salidas por usuario (lo ideal sería crear un singleton terminal o algo así y ordenar un poquito)
// si es windows
if (process.platform === "win32") {
    rl.on("SIGINT", function () {
        process.emit("SIGINT")
    })
}

// manejar en caso de querer salir
process.on('SIGINT', function () {
    console.log()
    console.log("Salieno del programa...".red)
    rl.close()
    process.exit(0);
})
// fin manejo de salidas por usuario

// preguntar por el script a ejecutar
let answer = await prompt('Introduce el número del script a ejecutar: '.yellow)

// validar que es un número
let index = Validator.parseInt(answer.trim())

if (Validator.isNotValid(index)) {
    console.log('Entrada inválida.'.red)
    rl.close()
    process.exit(1)
}

// normalizar a la lista [de 0 a n]
index -= 1

// salir si está fuera de los valores aceptados
if (index < 0 || index >= scriptsEntrys.length) {
    console.log('Selección inválida.'.red)
    rl.close()
    process.exit(1)
}

let scriptName = scriptsKeys[index]!
let scriptEntry = scriptsEntrys[index]!

console.log(`Ejecutando ${scriptName}...`.blue)
let out = await scriptEntry(rl)

// imprimir si se ha ejecutado correctamente y mostrar el mensaje de salida
if (out.success) {
    console.log(`El script "${scriptName}" se ha ejecutado con éxito devolviendo: ${out.message}`.green)
} else {
    console.log(`El script "${scriptName}" ha fallado devolviendo: ${out.message}`.red)
}

rl.close()
process.exit(0)