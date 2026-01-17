/**
 * Controlador para leer y modificar le dotenv de manera personalizada
 * 
 * Obviamente tiene limitaciones no como el dotenv original. Pero por contraparte este realiza exactamente lo que quiera.
 * 
 * Normas de este parser:
 *  - Interpreta cada linea por separado (detectando saltos de linea)
 *  - Ignora las lineas vacías (usa trim())
 *  - Ignora las lineas que comiencen en #
 *  - Lee las variables como nombre="valor" (solo valen las comillas dobles)
 */
import { LineByLineBuffer } from "@class/LineByLineBuffer.server.mjs"
import { ENV_FILE_PATH } from "@data/paths.mjs"
import { existsSync, statSync, writeFileSync } from "fs"
import { EOL } from "os"

// regex para las variables
/** 
 * (?<!\\) que no le preceda un \
 * comillas simples o dobles (agrupadas)
 * cualquier caracter, el signo +? es 1 caracter o más (en modo perezoso, escoger los menores carácteres)
 * (?<!\\) que no le preceda un \
 * \1 referencia al grupo uno (llama otra vez a "|')
 */
const varValRegex = /(?<!\\)('|").*?(?<!\\)\1/i

// regex para nombre, solo permitir 0-9 y letras y guión y no permitir números al inicio
const varNameRegex = /[a-z_][0-9a-z_]+/i

export class DotEnvManager {

    declare lineByLineBuffer: LineByLineBuffer
    // path al fichero env
    envFilePath: string = ''
    // marca la última vez que se cambió el archivo
    lastChanged = 0
    // el contenido del archivo
    fileContents = ''
    // variables del archivo de entorno
    dotenvVariables: { [key: string]: string } = {}

    /**
     * Constructor de la clase
     * 
     * importante llamar await objeto.init() para inicializar el manager
     * 
     * @param filePath Ruta al archivo .env o el por defecto
     */
    constructor(envFilePath = ENV_FILE_PATH) {
        // revisar si existe el .env
        if (!existsSync(envFilePath)) {
            /**
             * Eso quiere decir que todavía no has setupeado tu instalación, sigue las indicaciones en el readme.md
             */
            throw new Error('Fatal: No se encontró el archivo .env', {
                cause: `No se ha encontrado el archivo de configuración ${envFilePath}`,
            })
        }

        // preparar propiedades
        this.envFilePath = envFilePath
        this.lineByLineBuffer = new LineByLineBuffer(this.envFilePath)
    }


    /**
     * Función de entrada para inicializar el controlador y leer el fichero env
     */
    async init() {
        // primero leer los contenidos del archivo y la última actualización
        await this.rebuildEnvContents()
    }

    /**
     * Función que lee el contenido del dotenv y lo guarda en el JSON del objeto
     * 
     * Importante: no revisa si el fichero ha sido actualizado
     */
    private async rebuildEnvContents(): Promise<{ [key: string]: string }> {
        // limpiar array con contenidos
        this.dotenvVariables = {}

        // buscar el valor
        let lineNum = 0
        for(let _line of this.fileContents.split(EOL)) {
            let line = _line.trim()
            lineNum += 1

            // permitir que falle si no está correcta la sintáxis
            let { emptyLine, varName: name, varValue } = _readVarFromLine(line, lineNum, this.envFilePath)

            // si es un espacio entonces saltar
            if (emptyLine) {
                continue
            }

            // controlar duplicaciones
            if (this.dotenvVariables[name] !== undefined) {
                throw new Error('Ocurrencia doble en fichero .env.', {
                    cause: `La variable "${name}" está duplicada (linea ${lineNum}). Error en el archivo "${this.envFilePath}".`
                })
            }

            this.dotenvVariables[name] = varValue
        }

        return this.dotenvVariables
    }

    /**
     * Función que lee el contenido del dotenv si ha sido actualizado y devuelve la variable buscada
     * 
     * @param varName Nombre de la variable a leer
     * @returns Valor de la variable o undefined si no existe
     */
    async getVar(varName: string) {
        // revisar se ha actualizado
        await this.checkUpdatedAndReload()

        // buscar el valor o undefined si no está
        return this.dotenvVariables[varName]
    }

    /**
     * Función para sobreescribir el contenido de una variable dotenv
     */
    async writeVar(varName: string, value: string, createIfNotExists = false): Promise<void> {
        // revisar se ha actualizado
        await this.checkUpdatedAndReload()

        if (this.dotenvVariables[varName] === undefined && !createIfNotExists) {
            throw new Error('Intento de sobrescribir una variable inexistente.', {
                cause: `La variable "${varName}" no existe. No se puede sobreescribir. Error en el archivo "${ENV_FILE_PATH}".`
            })
        }
        // revisar si existe en el JSON
        if (this.dotenvVariables[varName] === undefined) {
            // validaciones
            if (!createIfNotExists) {
                throw new Error('Intento de sobrescribir una variable inexistente.', {
                    cause: `La variable "${varName}" no existe. No se puede sobreescribir. Error en el archivo "${ENV_FILE_PATH}".`
                })
            }

            // comprobar que el nombre son solo caracteres alfanuméricos y guiones bajos
            let match = varName.match(varNameRegex)
            if (match === null || match[0] !== varName) {
                throw new Error('Error de sintaxis: Nombre inválido.', {
                    cause: `El nombre de la variable solo puede contener letras, números o guiones bajos y no comenzar con número, variable no válida: "${varName}"`
                })
            }

            // crear variable al final del fichero
            this.fileContents += `${EOL}${varName}="${value}"`
        } else {
            // asumir que el fichero está correcto y reemplazar con regex: /${varName}=(?<!\\)('|").*?(?<!\\)\1/im
            this.fileContents = this.fileContents.replace(new RegExp(`${varName}=(?<!\\\\)('|").*?(?<!\\\\)\\1`, 'gi') , `${varName}="${value}"`)
        }


        // guardar el cambio en disco
        writeFileSync(this.envFilePath, this.fileContents, 'utf-8')

        // actualizar la clase
        await this.checkUpdatedAndReload(true)
    }

    /**
     * Revisa si el fichero ha sido modificado y lo relee
     */
    async checkUpdatedAndReload(force = false) {
        let { mtimeMs } = statSync(this.envFilePath)
        if (force || mtimeMs !== this.lastChanged) {
            // actualizar la variable global de última actualización
            this.lastChanged = mtimeMs
            this.fileContents = await this.lineByLineBuffer.openReadAllClose(true)

            // actualizar variables
            await this.rebuildEnvContents()

            return true
        }

        return false
    }
}

/**
 * función para leer una linea y filtrar la variable lanzando excepción si está incorrecto
 * @param line
 * @param lineNum
 * @param envFilePath
 * @returns Un objeto con el informe
 * @throws Error si la linea está incorrectamente formada
 */
export const _readVarFromLine = (line: string, lineNum: number, envFilePath: string): { emptyLine: boolean, varName: string, varValue: string } => {
    // si es un comentario ignorarlo
    if (line.startsWith('#')) {
        return {
            emptyLine: true,
            varName: '',
            varValue: 'comment'
        }
    }

    // si una linea está vacía ignorar
    if (line === '') {
        return {
            emptyLine: true,
            varName: '',
            varValue: 'emptySpace'
        }
    }

    // dividir la línea en nombre y valor
    let [_name, _value] = line.split('=')
    if (_name === undefined || _value === undefined) {
        throw new Error('Error de sintaxis: Variable inválida.', {
            cause: `Solo es válido nombre="valor" en el archivo "${envFilePath}" (linea ${lineNum}): ${line}`
        })
    }

    let name = _name.trim()
    let value = _value.trim()

    // aquí soy consciente de que se podrá permitir valores como strings vacíos "" o ''
    if (name === '' || value === '') {
        throw new Error('Error de sintaxis: nombre o variable vacíos.', {
            cause: `El nombre y valor no pueden estar vacíos en el archivo "${envFilePath}" (linea ${lineNum}): ${line}`
        })
    }

    // comprobar que el nombre son solo caracteres alfanuméricos y guiones bajos
    let match = name.match(varNameRegex)
    if (match === null || match[0] !== name) {
        throw new Error('Error de sintaxis: Nombre inválido.', {
            cause: `El nombre de la variable solo puede contener letras, números o guiones bajos y no comenzar con número en el archivo "${envFilePath}" (linea ${lineNum}): ${line}`
        })
    }

    // el valor debe estar entre "" o ''
    match = value.match(varValRegex)
    // if (!varValRegex.test(value)) {
    if (match === null) {
        throw new Error('Error de sintaxis: delimitadores de variable inválidos.', {
            cause: `El valor debe estar entre comillas dobles o simples en el archivo "${envFilePath}" (linea ${lineNum}): ${line}`
        })
    }

    // recoger coincidencia del regex (está en lazzy por lo que recogerá el inicial)
    value = match[0]

    // remover las comillas de los extremos
    value = value.substring(1, value.length - 1)

    return {
        emptyLine: false,
        varName: name,
        varValue: value
    }
}