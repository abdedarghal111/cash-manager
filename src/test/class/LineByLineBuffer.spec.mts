import { LineByLineBuffer, READ_BYTES } from "@class/LineByLineBuffer.server.mjs"
import { TEST_FILES_DIR_PATH } from "@data/paths.mjs"
import { readFileSync, unlinkSync, writeFileSync } from "fs"
import { EOL } from "os"
import { resolve } from "path"

let FILES_PATH = resolve(TEST_FILES_DIR_PATH, 'LineByLineBuffer')

// crear un fichero con un contenido para testear
const extraFiles: string[] = []
const createFileWithContent = (content: string) => {
    let file = resolve(FILES_PATH, `CreatedTestFile${extraFiles.length + 1}`)
    writeFileSync(file, content, 'utf-8')
    extraFiles.push(file)
    return file
}

beforeAll(async () => {
    
})

/**
 * Tests básicos para comprobar que funcionan las funcionalidades implementadas
 */
describe("Line by line Buffer tests", () => {
    it("Reads the entire file", async () => {
        let testFile = resolve(FILES_PATH, 'test1.txt')

        // leer archivo completo
        let expectedFileContents = readFileSync(testFile, 'utf-8')

        // leer el archivo con el buffer
        let myBuffer = new LineByLineBuffer(testFile)

        let outStr = ''
        let nextStr: string | null = null

        await myBuffer.openFile()
        nextStr = await myBuffer.readLine(true, false)
        while (nextStr !== null) {
            outStr += nextStr
            nextStr = await myBuffer.readLine(true, false)
        }
        await myBuffer.closeFile()

        expect(outStr).toBe(expectedFileContents)
        expect(myBuffer.isFileOpened()).toBeFalse()
    })

    it("Reads two files at the same time and get correct contents", async () => {
        // escribir ficheros de test
        let testFile1 = `LINEA11${EOL}LINEA12${EOL}LINEA13${EOL} `
        let test1Path = createFileWithContent(testFile1)
        let testFile2 = `LINEA21${EOL}LINEA22${EOL}LINEA23`
        let test2Path = createFileWithContent(testFile2)

        // crear dos buffers y leer 2 lineas de cada archivo
        let myBuffer1 = new LineByLineBuffer(test1Path)
        let myBuffer2 = new LineByLineBuffer(test2Path)

        await myBuffer1.openFile()
        await myBuffer2.openFile()

        let out1 = (await myBuffer1.readLine()) as string
        let out2 = (await myBuffer2.readLine()) as string
        out1 += (await myBuffer1.readLine()) as string
        out2 += (await myBuffer2.readLine()) as string

        
        // probar que las salidas son como planeamos
        expect(out1).toBe(testFile1.split(EOL)[0]! + testFile1.split(EOL)[1]!)
        expect(out2).toBe(testFile2.split(EOL)[0]! + testFile2.split(EOL)[1]!)

        // el buffer cierra el archivo automáticamente cuando tiene todo el fichero leido
        expect(myBuffer1.isFileOpened()).toBeFalse()
        expect(myBuffer2.isFileOpened()).toBeFalse()

        // reabrir los archivos o mantener abiertos
        await myBuffer1.openFile()
        await myBuffer2.openFile()

        // escribir cancelando cierre automático
        out1 += (await myBuffer1.readLine(false, false)) as string
        out2 += (await myBuffer2.readLine(false, false)) as string

        expect(out1).toBe(testFile1.replaceAll(EOL, '').replace(' ', ''))
        expect(out2).toBe(testFile2.replaceAll(EOL, ''))

        // probar que lee las partes finales correctamente
        expect(myBuffer1.isFileOpened()).toBeTrue()
        expect(await myBuffer1.readLine()).toBe(' ')
        expect(await myBuffer1.readLine()).toBe(null)
        expect(await myBuffer2.readLine()).toBe(null)

        expect(myBuffer1.isFileOpened()).toBeFalse()
        expect(myBuffer2.isFileOpened()).toBeFalse()
    })

    it("Read a big file correctly (buffer check)", async () => {
        // obtener buffer de read bytes de line buffer
        let goodSizeBuffer = Buffer.alloc(READ_BYTES, 0, 'utf-8')
        goodSizeBuffer.fill('F')

        // escribir ficheros de test
        let testFile1 = goodSizeBuffer.toString('utf-8', 0, READ_BYTES).concat(EOL).repeat(3)
        let test1Path = createFileWithContent(testFile1)

        // crear dos buffers y leer 2 lineas de cada archivo
        let myBuffer = new LineByLineBuffer(test1Path)

        await myBuffer.openFile()
        
        // probar que las salidas son como planeamos
        expect((await myBuffer.readLine())).toBe(testFile1.split(EOL)[0]!)
        expect((await myBuffer.readLine())).toBe(testFile1.split(EOL)[0]!)
        expect((await myBuffer.readLine())).toBe(testFile1.split(EOL)[0]!)
        expect((await myBuffer.readLine())).toBe(null)

        expect(myBuffer.isFileOpened()).toBeFalse()
    })

    it("Reads the entire file with openReadAllClose", async () => {
        let testFile = resolve(FILES_PATH, 'test1.txt')

        // leer archivo completo
        let expectedFileContents = readFileSync(testFile, 'utf-8')

        // leer el archivo con el buffer
        let myBuffer = new LineByLineBuffer(testFile)

        let outStr = await myBuffer.openReadAllClose(true)
        
        expect(outStr).toBe(expectedFileContents)
        expect(myBuffer.isFileOpened()).toBeFalse()
    })
})

afterAll(async () => {
    // eliminar los archivos extra creados
    for (let file of extraFiles) {
        unlinkSync(file)
    }
})