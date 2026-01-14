import c from 'colors'

/**
 * Funciones auxiliares para los scripts de build
 */

import { statSync } from "fs"
import { isAbsolute, parse, relative, resolve } from "path"

/**
 * Sale del programa con un mensaje de error y estado de error
 * 
 * @param {string} message Mensaje a mostrar antes de salir
 */
export const fail = (msg) => {
    console.log(c.red(msg) + "\n\n")
    process.exit(1)
}

/**
 * Verifica si un archivo o directorio existe.
 * 
 * @param {string} path - La ruta del archivo o directorio a verificar.
 * @returns {{ exists: boolean, isFile: boolean }} Si existe y si es un archivo
 */
export const fileExists = (path) => {
    let exists = false
    let isFile = false

    try {
        let stats = statSync(path)
        exists = true

        if (stats.isFile()) {
            isFile = true
        }
    } catch (e) {
        // entonces exists = false
    }

    return { exists: exists, isFile: isFile }
}

/**
 * Devuelve si un path es válido y si es relativo o absoluto y el path limpio
 * 
 * @param {string} path - La ruta del archivo o directorio a verificar.
 * @returns {{valid: boolean, isAbsolute: boolean}} - Un objeto con la información de validez y tipo de ruta
 */
export const parsePath = (path) => {
    let isValid = true
    let isRoot = true
    try {
        let resolveInfo = parse(path)
        if (resolveInfo.root === '') {
            isRoot = false
        }
    } catch (e) {
        isValid = false
    }

    // será recibido como let { isValid, isAbsolute, cleanPath } = parsePath(path)
    return { isValid: isValid, isAbsolute: isRoot }
}

/**
 * Comprueba si un path pertenece a la carpeta introducida
 * 
 *  @param {string} folderPath - La carpeta que se quiere comprobar si contiene el path
 *  @param {string} path - La ruta del archivo o directorio a verificar.
 *  @returns { {isInside: boolean, relPath: string }} - Un objeto con la información de validez y la ruta relativa
 */
export const belongsToFolder = (folderPath, path) => {
    // obtener la ruta de uno hacia el otro
    const relPath = relative(folderPath, path)

    let isInside = false

    // si el path no es el mismo que ''
    // y el relativo no sale de la carpeta (empieza por '..')
    // y también no es una ruta absoluta, entonces está dentro de la carpeta
    if (relPath !== '' && !relPath.startsWith('..') && !isAbsolute(relPath)) {
        isInside = true
    } else {
        isInside = false
    }

    // console.log(`[${folderPath}, ${path}] => ${relPath} => ${isInside ? "true" : "false"}`);

    return { isInside: isInside, relPath: relPath }
}

// opción por defecto
export const DEF_OPT = '0'
/**
 * Devuelve los argumento y opciones que se han introducido junto a la ejecución
 * 
 * Se le puede insertar el nombre de los argumento
 * 
 * El argumento que contiene todo el resto es la variable DEF_OPT (en este caso '0')
 * 
 * Ejemplo:
 *      getInputParams([['f', 'file'], ['o', 'output'], ['p', 'postProcess']])
 *      Capturaría una entrada como `node miScript.mjs -f archivoTal arg -o output --file archivotal2 argExtra`
 *      Y lo devolvería como: { 
 *                              'f': ['archivoTal', 'archivotal2'],
 *                              'file': ['archivoTal', 'archivotal2'],
 *                              'o': ['output'],
 *                              'output': ['output'],
 *                              'p': false,
 *                              'postProcess': false,
 *                              '0': ['arg', 'argExtra']
 *                            }
 * 
 * Especificaciones técnicas:
 * - Si se introduce un argumento que no está en la lista, falla
 * - Si se introduce un argumento pero no ha sido usado por el usuario (se coloca como false)
 * - Si el array está vacío es porque el usuario ha introducido el argumento pero no le ha colocado valores
 * - El nombre abreviado y el nombre largo contienen el mismo array y mismo valor
 * 
 * @param paramNames = [[shortForm, longForm], ...]
 * @returns {{[key: string]: string[]} | string} Devuelve el esquema o un string si ha fallado
 */
export const getInputParams = (schema = []) => {
    // validar entrada
    if (!Array.isArray(schema)) {
        throw new Error(`El array introducido no es válido: ${toString(schema)}`)
    }
    schema.forEach((arr, index) => {
        if (!Array.isArray(arr)) {
            throw new Error( `Elemento en la posición ${index} del array introducido no es un array válido: ${toString(arr)}` )
        }
        if (arr.length !== 2) {
            throw new Error(`El elemento en la posición ${index} del array introducido no tiene solo dos elementos: ${toString(arr)}`)
        }

        if (typeof arr[0] !== 'string' || typeof arr[1] !== 'string') {
            throw new Error(`Los elementos en la posición ${index} del array introducido no son strings válidos: ${toString(arr)}`)
        }
        
        if (arr[0].length !== 1) {
            throw new Error(`El elemento abreviado en la posición ${index} del array introducido debe tener solo un caracter: ${toString(arr[0])}`)
        }

        if (arr[1].length < 2) {
            throw new Error(`El elemento largo en la posición ${index} del array introducido debe tener al menos dos caracteres: ${toString(arr[1])}`)
        }
    })

    // crear un objeto con los parámetros y sus valores
    let outParams = {}
    for (let [shortName, longName] of schema) {
        outParams[shortName] = false
        outParams[longName] = false
    }
    outParams[DEF_OPT] = []
    schema.push([DEF_OPT, DEF_OPT])

    // iterar sobre cada elemento de manera ordenada
    let i = 0 // iterador para saltar los dos primeros
    let currentArg = DEF_OPT // or [shortName, longName]
    for (let arg of process.argv) {
        if (i < 2) {
            // volver en los dos primeros 2 argumentos que son el node y el script
            i += 1
            continue
        }

        // es un argumento
        if(arg.startsWith('-')) {
            // let startWith = ''
            let argName = ''
            let argArr = undefined
            if (arg.startsWith('--')) {
                // es doble argumento
                // startWith = '--'
                argName = arg.substring(2)

                // buscar si el argumento existe
                argArr = schema.find(([shortName, longName]) => longName === argName)
                if (argArr === undefined) {
                    return `El argumento ${arg} no existe como opción en el programa.`
                }
            } else {
                // es argumento abreviado
                // startWith = '-'
                argName = arg.substring(1)
                if (argName.length !== 1) {
                    // argumento con longitud incorrecta
                    return `El argumento ${arg} no es un argumento válido.`
                }

                // buscar si el argumento existe
                argArr = schema.find(([shortName, longName]) => shortName === argName)
                if (argArr === undefined) {
                    return `El argumento ${arg} no existe como opción en el programa.`
                }
            }

            // si todavía no se ha estrenado, marcar como existente y usarlo
            if (!outParams[argArr[0]]) {
                let commonArray = [] // compartir array
                outParams[argArr[0]] = commonArray
                outParams[argArr[1]] = commonArray
            }

            // asignar argumento actual
            currentArg = argName
        } else {
            // entonces es un valor
            // ingresar al argumento indicado
            outParams[currentArg].push(arg)
            if (currentArg !== DEF_OPT) {
                // reasignar al defecto
                currentArg = DEF_OPT
            }
        }
    }

    // añadir los argumentos que no han sido usados

    return outParams
}