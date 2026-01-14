/**
 * Simplemente un buffer parecido a ReadLine (interface) solo que lee cuando tu le indicas y no cuando quiere y pausa cuando quiere.
 * 
 * Se le autoCrea un ReadStream para leer los contenidos y te pasa solo la línea que le indiques.
 */
import { accessSync, constants as FileConstants, existsSync, statSync, createReadStream, ReadStream, openSync, readFileSync } from "fs"
import { FileHandle, open } from "fs/promises"
import { EOL } from "os"

// salto de linea en windows
const WIN_EOL = "\r\n"

// salto de linea en linux
const LIN_EOL = "\n"

// bytes máximos a leer con cada iteración
export const READ_BYTES = 4096 // tras investigar 4kb suele ser el tamaño de página que usa el OS y lee y también los discos usan bloques de 4kb algunos

// crear el buffer al inicio para usar en conjunto (limpiarlo con ceros)
const buffer = Buffer.alloc(READ_BYTES, 0, 'utf-8')

export class LineByLineBuffer {
    // archivo a leer que es creado en el constructor
    declare filePath: string

    // el pedazo de la siguiente linea que ha sido leido por exceso
    private bufferExcess: string | null = null
    
    // linea que está siendo leida actualmente
    private currentLine: string = ''

    // la posición actual leyendo el fichero
    private fileReadingPos = 0

    // si se ha llegado al final del fichero
    private reachedEnd = false

    // el manejador del archivo
    private fHandler: FileHandle | null = null

    /**
     * Constructor, requiere del path del archivo a leer
     * 
     * Antes de abrirlo comprueba que se puede acceder y que realmente existe
     * 
     * @throws Error si no se puede acceder o si el archivo no existe
     */
    constructor(path: string) {
        if (typeof path !== "string") {
            // lanzar excepción porque no es un string la entrada introducida
            throw new Error("El tipo de dato introducido en el parámetro 'path' debe ser un string")
        }

        // si no existe el path fallar
        if (!existsSync(path)) {
            throw new Error(`No se encuentra el archivo en la ruta proporcionada: ${path}`)
        }

        let stats = statSync(path)
        if (!stats.isFile()) {
            // devolver error de que no es un fichero
            throw new Error("El path proporcionado no corresponde a un archivo (Será una carpeta u otra cosa)")
        }

        // comprobar si el archivo se puede leer y existe
        try {
            accessSync(path, FileConstants.R_OK | FileConstants.W_OK)
            // si ha llegado aquí se puede acceder
        } catch (err) {
            // lanzar error d que no se puede leer o escribir el archivo
            throw new Error(`No se puede leer o escribir en el archivo proporcionado: ${path}`)
        }

        // asignar el path
        this.filePath = path
    }

    /**
     * Función que abre el archivo para su lectura
     */
    async openFile(): Promise<void> {
        // abrir el archivo si no está abierto

        if (this.fHandler === null) {
            // aquí se observan el tipo de flags para los ficheros: https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs#the-flags-youll-likely-use-are
            this.fHandler = await open(this.filePath, 'r+')
        }
    }

    /**
     * Function que cierra el archivo
     */
    async closeFile(): Promise<void> {
        // cerrar el archivo si está abierto
        if (this.fHandler !== null) {
            await this.fHandler.close()
            this.fHandler = null
        }
    }

    /**
     * Revisa si el archivo está abierto
     */
    isFileOpened(): boolean {
        return this.fHandler !== null
    }

    /**
     * Revisa si el archivo está abierto
     */
    async closeFileIfReachedEnd() {
         if (this.reachedEnd) {
            await this.closeFile()
         }
    }

    /**
     * Función que lee la siguiente linea y la devuelve como string
     * 
     * Detalle!: usa `import { EOL } from "os"` para devolver el salto de linea
     * 
     * @param includeEOL Si se devuelve el string sin el salto de línea al final o no (por defecto no se devuelve)
     * @param closeOnRanOut Si se cierra el fichero al acabar de leer (por defecto si)
     */
    async readLine(includeEOL = false, closeOnRanOut = true): Promise<string|null> {
        // el error de apertura lo produce readchunk
        if (closeOnRanOut) {
            await this.closeFileIfReachedEnd()
        }

        // loopear hasta encontrar un \n
        this.currentLine = ''

        // mientras no se ha llegado al final o no exista salto de linea:
        while (this.bufferExcess !== null || !this.reachedEnd) {
            // revisar que el exceso no esté vacío
            if (this.bufferExcess === null) {
                // leer un trozo de fichero
                this.bufferExcess = await this.readChunk(closeOnRanOut)

                // si no queda nada por leer entonces salir
                if (this.bufferExcess === null) {
                    if (closeOnRanOut) {
                        await this.closeFileIfReachedEnd()
                    }
                    break
                }
            }

            // si existe salto de linea (se comprueba estas 3 combinaciones para compatibilidad: \r\n|\r|\n) (el \r está deprecadissimo)
            let founded = this.bufferExcess.search(/(\r\n|\n)/)
            if (founded !== -1) {
                // se ha encontrado salto de línea

                // revisar que tipo de salto de linea tiene
                let posibleJump = this.bufferExcess.substring(founded, founded + 2)
                let nextEOL = posibleJump === WIN_EOL ? WIN_EOL : LIN_EOL // por defecto linux EOL
                // console.log(`-${this.bufferExcess.substring(founded - 1, founded).replace("\n", "N").replace("\r", "R")}`)

                // cortar el string antes del salto de linea
                this.currentLine += this.bufferExcess.substring(0, founded)

                // sumarle el EOL del sistema operativo ACTUAL si está marcado añadir el salto
                if (includeEOL) {
                    this.currentLine += EOL
                }

                // establecer el exceso desde donde no se escogió hasta el final
                this.bufferExcess = this.bufferExcess.substring(founded + nextEOL.length)

                if (this.bufferExcess.length === 0) {
                    this.bufferExcess = null
                }

                // devolver el string
                return this.currentLine
            } else {
                // si no existe salto entonces sumarlo a la linea actual
                this.currentLine += this.bufferExcess
                this.bufferExcess = null
            }
        }

        // añadir el exceso si no existe salto de linea y ya no hay más fichero por leer
        if (this.reachedEnd) { // creo que este loop es innecesario
            this.currentLine += this.bufferExcess ?? ''
        }

        // devolver la siguiente linea o nulo si no hay nada que leer
        return this.currentLine === '' ? null : this.currentLine
    }

    /**
     * Lee un chunk y devuelve el resultado
     * 
     * @param closeOnRanOut Si se cierra el fichero al acabar de leer (por defecto si)
     */
    async readChunk(closeOnRanOut = true): Promise<string|null> {
        // si no existe el handler fallar
        if (this.fHandler === null) {
            /**
             * Si te ha fallado aquí es porque debes ejecutar el this.openFile() antes que todas las operaciones
             */
            throw new Error("El archivo no ha sido abierto aún")
        }

        // si ha llegado al final entonces devolver vacío
        if (this.reachedEnd) {
            if (closeOnRanOut) {
                await this.closeFileIfReachedEnd()
            }
            return null
        }

        // solicitar leer 4096 bytes de la posición actual
        // devuelve el buffer y los bytes leidos: https://nodejs.org/api/fs.html#filehandlereadbuffer-offset-length-position
        let { bytesRead, buffer: _ } = await this.fHandler.read(
            buffer,
            0, // donde comenzar a escribir en el buffer
            READ_BYTES, // numero de bytes a leer
            this.fileReadingPos // posición de donde comenzar a leer
        )

        // sumar la posición a los bytes leidos
        this.fileReadingPos += bytesRead

        // si no se ha leido todo el chunk entonces no queda por leer
        if (bytesRead === 0) {
            this.reachedEnd = true
            if (closeOnRanOut) {
                await this.closeFileIfReachedEnd()
            }
            return null
        }

        // si no se ha leido todo el chunk entonces no queda por leer
        if (bytesRead !== READ_BYTES) {
            this.reachedEnd = true
            if (closeOnRanOut) {
                await this.closeFileIfReachedEnd()
            }
        }

        // devolver como string la cantidad de buffer leida
        let outStr = buffer.toString('utf-8', 0, bytesRead)

        // limpiar buffer despues de usarlo
        buffer.fill(0, 0, bytesRead)

        return outStr
    }
}