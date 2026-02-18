/**
 * Controlador de la versión del proyecto.
 * Se ofrecen métodos para interpretar las versiones del proyecto
 */
import { Validator } from "@single/Validator.mts"
import versionFixesServer from "@data/versionFixes.server.mjs"
import { ServerConfig } from "@single/ServerConfig.server.mts"
import { Logger } from "@class/Logger.server.mjs"
import { cpSync, existsSync, glob, globSync, mkdirSync, rmSync } from "fs"
import { BACKUP_LOCAL_DATA_PATH, LOCAL_DATA_PATH } from "@data/paths.mjs"
import { basename, resolve } from "path"

type VersionTuple = [number, number, number]

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
    turnVersionToArray: (version: string): VersionTuple => {
        // dividir por el punto 
        let splitVersion = version.split('.')

        // comprobar que tiene exactamente 3 elementos
        if (splitVersion.length !== 3) {
            throw new Error("Se ha introducido una versión no válida", {
                cause: `La versión debe tener exactamente 3 números separados por puntos, "${version}" no es válido.`
            })
        }

        // convertir en número las versiones
        let arrayVersion = []

        // para cada número
        for (let numero of splitVersion) {

            // introducir números
            let numParsed = Validator.parseNumber(numero)

            // validar
            if (Validator.isNotValid(numParsed)) {
                throw new Error("Se ha introducido una versión no válida", {
                    cause: `El elemento ${numero} de la versión ${version} no es un número válido`
                })
            }

            // guardar
            arrayVersion.push(numParsed)
        }

        // devolver
        return arrayVersion as VersionTuple
    },

    /**
     * Devuelve si "version1" es mayor (1), menor(-1) o igual(0) a "version2"
     */
    compareVersions: (version1: VersionTuple, version2: VersionTuple): number => {
        // probar con cada una si es mayor o menor
        for (let i = 0; i < 3; i++) {
            let a = version1[i]!
            let b = version2[i]!
            if (a > b) {
                return 1
            } else if (a < b) {
                return -1
            }
        }

        // son iguales
        return 0
    },

    /**
     * Devuelve si "versión" es menor o igual a la "version1" y mayor que "version2"
     * 
     * Sirve para comprobar versiones pendientes de actualizar
     */
    isVesionBetween: (version: VersionTuple, version1: VersionTuple, version2: VersionTuple): boolean => {
        // comprobar que esté entre los dos elementos
        // version > current && version <= target (comparación lexicográfica)        
        const cmpVersionCurrent = VersionController.compareVersions(version, version2)
        const cmpVersionTarget = VersionController.compareVersions(version, version1)
        const cmpCurrentTarget = VersionController.compareVersions(version2, version1)

        // Si current > target, rango inválido, devolver false
        if (cmpCurrentTarget > 0) return false

        // version debe ser mayor que current y menor o igual que target
        return cmpVersionCurrent > 0 && cmpVersionTarget <= 0
    },

    /**
     * Realiza una copia de los datos en otra carpeta con el nombre de la versión actual
    */
   backupData: (version: string): { path: string, error?: Error } => {
       let backupPath = resolve(BACKUP_LOCAL_DATA_PATH, `local_data_v${version}`)
       
       // si existe la carpeta entonces salir
       if (existsSync(backupPath)) {
            // TODO: implementar que revise que exista todos y cada uno de los ficheros para asegurar que está actualizada la copia
            Logger.warn(`Ya existe una copia de seguridad para la versión ${version}. No se ha creado otra.`, 3)
            return {
                path: backupPath,
                error: undefined
            }
        }

        // crear la carpeta del backup
        try {
            mkdirSync(backupPath, { recursive: true })
        } catch (error) {
            Logger.logError(error as Error, 'CREATE BACKUP ERROR')
            return {
                path: backupPath,
                error: new Error('FATAL: No se pudo crear la copia de seguridad', {
                    cause: `No se ha podido crear la carpeta ${backupPath}, quizás no tengas permisos`
                })
            }
        }

        // recoger todos los ficheros de local_data excepto el backup
        let files = globSync(resolve(LOCAL_DATA_PATH, '*')).filter(file => basename(file) !== 'backup')

        // copiar cada uno de ellos a la carpeta de backup
        for (const file of files) {
            let targetFile = resolve(backupPath, basename(file))
            try {
                cpSync(file, targetFile, {
                    force: true,
                    preserveTimestamps: true,
                    recursive: true
                })
            } catch (error) {
                Logger.logError(error as Error, 'CREATE BACKUP ERROR')
                return {
                    path: backupPath,
                    error: new Error('FATAL: No se pudo crear la copia de seguridad', {
                        cause: `No se ha podido copiar el fichero ${file} a ${targetFile}`
                    })
                }
            }
        }

        return {
            path: backupPath,
            error: undefined
        }
    },

    /**
     * Revierte la copia de seguridad (sobreescribe los datos de la carpeta introducida en local_data actual)
     * 
     * @returns true si hay éxito, false si algo ha ocurrido mal
     */
    rollbackBackup: (backupPath: string): Error|undefined => {
        // si no existe la carpeta entonces salir
        if (!existsSync(backupPath)) {
            // esto no debería ni de pasar (indicaría manipulación de fuera o que alguién creó la carpeta y la borró)
            return new Error('FATAL: No se pudo revertir la copia de seguridad', {
                cause: `No existe la ruta ${backupPath}, no se han copiado los datos.`
            })
        }

        // recoger todos los ficheros de la backup
        let files = globSync(resolve(backupPath, '*'))

        // copiar cada uno de ellos a la carpeta de local_data
        for (const file of files) {
            let targetFile = resolve(LOCAL_DATA_PATH, basename(file))
            try {
                cpSync(file, targetFile, {
                    force: true,
                    preserveTimestamps: true,
                    recursive: true
                })
            } catch (error) {
                Logger.logError(error as Error, 'ROLLBACK BACKUP ERROR')
                return new Error('FATAL: No se pudo revertir la copia de seguridad', {
                    cause: `No se ha podido sobreescribir el fichero ${file} a ${targetFile}`
                })
            }
        }

        return undefined
    },

    /**
     * Intenta migrar a una versión específica,
     * 
     * Si cualquier paso falla, muestra información.
     * 
     * 1. Crea una copia de seguridad
     * 2. Intenta actualizar
     * 3. Si salta error, recupera la copia
     * 4. Si no hay errores devuelve la muestra
     * 
     * TODO: crear un backup handler aparte fuera para las backups (facilitar testing y también aislar responsabilidades)
     */
    tryUpdateToVersion: async (actualVer: string, newVer: string, updateFunc: () => Promise<void>): Promise<boolean> => {
        // primero crear copia de seguridad
        Logger.info(`Creando copia de seguridad para la versión ${actualVer}`, 2)
        let { path: securityCopyPath, error: errorOnCreate } = VersionController.backupData(actualVer)

        // si no se ha podido crear, notificar e intentar borrarla.
        if (errorOnCreate !== undefined) {
            Logger.error(errorOnCreate.message, 2)
            Logger.error(errorOnCreate.cause as string, 3)
            Logger.info(`No se ha podido crear la copia de seguridad, intentando borrarla...`, 2)
            if (existsSync(securityCopyPath)) {
                try {
                    rmSync(securityCopyPath, { recursive: true })
                    Logger.success(`Copia de seguridad eliminada correctamente.`, 3)
                } catch (error) {
                    Logger.error(`No se ha podido borrar la copia de seguridad corrupta ${securityCopyPath}`, 2)
                    Logger.warn('INTERVENCIÓN MANUAL REQUERIDA!', 3)
                    Logger.warn(`MODO DE ACTUAR: Revise si se ha creado la carpeta ${securityCopyPath}, proceda a borrarla.`, 3)
                }
            }

            return false
        }

        // copia de seguridad creada correctamente
        Logger.success(`Usando copia de seguridad en: ${securityCopyPath}`, 3)

        // siguiente paso, intentar aplicar la actualización
        Logger.info(`Actualizando a la versión ${newVer}...`, 2)
        try {
            await updateFunc()
            // todo ok
            return true

        } catch (e) {
            
            Logger.warn(`Hubo un error al intentar actualizar de la versión ${actualVer} a la versión ${newVer}.`, 3)
            Logger.logError(e as Error, `UPDATE v${newVer} ERROR`)

            Logger.info(`Revirtiendo copia de seguridad...`, 1)
            // intentar revertir copia
            let error = VersionController.rollbackBackup(securityCopyPath)
            
            if (error !== undefined) {
                // si ni si quiera se pudo restaurar la copia de seguridad
                Logger.error(error.message, 2)
                Logger.error(error.cause as string, 3)
                Logger.warn(`INTERVENCIÓN MANUAL REQUERIDA!`, 2)
                Logger.warn(`MODO DE ACTUAR: Copie los archivos de ${securityCopyPath} a ${LOCAL_DATA_PATH}, sobreescribelos si es necesario`, 3)
                // TODO: implementar en la utilidad de terminal una opción para mover la copia automáticamente
                // TODO: implementar en la utilidad de la terminal una opción para migrar a copias hacia atras
            } else {
                Logger.success('Copia de seguridad restaurada correctamente.')
            }

            // devolver estado de error
            return false
        }
    },

    /**
     * Marca la instalación como completada en caso de nueva instalación
     * 
     * Este método existe porque si se asigna directamente la versión en checkAndApplyVersions() 
     * y algo falla más adelante se habría marcado como instalado cuando todavía hay componentes sin inicializarse.
     * De esta manera solo se marcará como instalado (en otro lugar del programa) cuando el último elemento se ha instalado correctamente.
     */
    markAsInstalled: () => {
        Logger.info(`Asignando versión actual al sistema: ${VERSION}`, 2)
        ServerConfig.set('SYSTEM_VERSION', VERSION)
    },

    

    /**
     * Revisa y ejecuta las funciones en orden para ejecutar version por version las modificaciones pendientes
     * para no romper la aplicación con nuevas o cambios en funcionalidades
     */
    checkAndApplyVersions: async () => {
        Logger.info('Revisando si hay actualizaciones locales pendientes...')
        let targetVersion = VERSION
        let systemVersion = ServerConfig.get('SYSTEM_VERSION', '')

        if (systemVersion === '') {
            // la instalación es nueva, no hay datos ni de versión.
            // Se establece la actual como versión del sistema
            Logger.warn(`Nueva instalación detectada`, 2)
            // avisar de que es una nueva instalación
            return 'newInstall'
        }

        // comparar las versiones para ver si hay que hacer algo
        if (systemVersion === targetVersion) {
            Logger.success('No hay actualizaciones locales pendientes.', 2)
            return 'noUpdates'
        }

        Logger.warn(`Nueva versión detectada: ${targetVersion} (versión actual: ${systemVersion})`, 2)

        // array con las versiones ordenadas
        let pendingVersions: [string, () => Promise<void>][] = []
        let targetVerArr = VersionController.turnVersionToArray(targetVersion)
        let systemVerArr = VersionController.turnVersionToArray(systemVersion)
        // preparar el array de la versión actual
        for (const [ver, updateFunc] of versionFixesServer) {
            // si la versión está entre los dos entonces añadirla al array
            let verArr = VersionController.turnVersionToArray(ver)
            if (VersionController.isVesionBetween(verArr, targetVerArr, systemVerArr)) {
                pendingVersions.unshift([ver, updateFunc])
            }
        }

        if (pendingVersions.length === 0) {
            Logger.info('No hay actualizaciones locales pendientes.', 3)
            Logger.info(`Asignando versión actual: ${targetVersion}`, 3)
            ServerConfig.set('SYSTEM_VERSION', targetVersion)
            return 'noUpdates'
        }

        Logger.info(`Realizando ${pendingVersions.length} actualizaciones...`, 2)
        Logger.warn(`No apagues el equipo o interrumpas la ejecución del servidor mientras se actualiza`, 2)

        for (const [ver, updateFunc] of pendingVersions) {
            // intentar actualizar con el protocolo de actualización
            let success = await VersionController.tryUpdateToVersion(systemVersion, ver, updateFunc)
            
            if (!success) {
                // si no se ha podido actualizar salir
                Logger.warn('INFO: Antes de volver a ejecutar, solucione los problemas existentes.', 1)
                Logger.info('Saliendo del programa...', 2)
                return 'errored'
            }

            // si no aplicar la versión y seguir
            systemVersion = ver
            ServerConfig.set('SYSTEM_VERSION', systemVersion)
            Logger.success(`Versión actualizada correctamente a ${systemVersion}`, 2)
        }

        Logger.success('Todas las actualizaciones realizadas correctamente.', 2)

        return 'updated'
    }
}

const ARRAY_VERSION = VersionController.turnVersionToArray(VERSION)