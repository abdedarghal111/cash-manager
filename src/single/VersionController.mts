/**
 * Controlador de la versión del proyecto.
 * Se ofrecen métodos para interpretar las versiones del proyecto
 */

import { Validator } from "./Validator.mts"

// propiedad "version" del fichero /package.json, definida como "X.X.X" siendo X un número unsigned
const VERSION = __VERSION__

/**
 * Clase controladora de versiones
 */
export const VersionController = {

    /**
     * Devuelve si son compatibles las versiones
     */
    isVersionCompatible: (otherVersion: string): boolean => {
        // generado por el autocompletado, chico listo
        let [major, minor, patch] = VersionController.turnVersionToArray(otherVersion)
        // recoger los actuales
        let [currentMajor, currentMinor, currentPatch] = ARRAY_VERSION
        
        // para que sean compatibles los cambios mayores y menores tienen que mantenerse iguales
        let compatibleVersions = (major === currentMajor && minor === currentMinor)

        return compatibleVersions
    },

    /**
     * Devuelve la versión como un array de 3 números enteros
     * 
     * @param versionStr Cadena de texto que representa una versión
     * @returns Array de 3 números enteros o null si no es válida
     * @trows Error si la versión no es válida
     */
    turnVersionToArray: (version: string): [number, number, number] => {
        // dividir por el punto 
        let splitVersion = version.split('.')

        // comprobar que tiene exactamente 3 elementos
        if(splitVersion.length !== 3) {
            throw new Error("Se ha introducido una versión no válida")
        }

        // convertir en número las versiones
        let arrayVersion = []

        // para cada número
        for (let numero of splitVersion) {

            // introducir números
            let numParsed = Validator.parseNumber(numero)

            // validar
            if (Validator.isNotValid(numParsed)) {
                throw new Error("Se ha introducido una versión no válida")
            }

            // guardar
            arrayVersion.push(numParsed)
        }

        // devolver
        return arrayVersion as [number, number, number]
    },
}

// preparar el array de la versión actual
const ARRAY_VERSION = VersionController.turnVersionToArray(VERSION)