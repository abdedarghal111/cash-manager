import { DotEnvManager, _readVarFromLine } from "@class/DotEnvManager.server.mjs"
import { TEST_FILES_DIR_PATH } from "@data/paths.mjs"
import { unlinkSync, writeFileSync, readFileSync } from "fs"
import { resolve } from "path"
import { EOL } from "os"

let FILES_PATH = resolve(TEST_FILES_DIR_PATH, 'DotEnvManager')

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
describe("DotEnv reader tests", () => {
    it("Checks if alerts when file not exists", async () => {
        let testFilePath = resolve(FILES_PATH, 'notExistsFile.env')

        expect(() => new DotEnvManager(testFilePath)).toThrow(new Error('Fatal: No se encontró el archivo .env'))
    })

    it("Checks that reads file correctly", async () => {
        let testFilePath = resolve(FILES_PATH, 'test1.env')
        let manager = new DotEnvManager(testFilePath)
        await manager.init()
        
        let output = await manager.getVar('PRIMERAVARIABLE')
        expect(output).toBe('si')
    })

    it("Checks that readValue works correctly", async () => {
        let testFilePath = resolve(FILES_PATH, 'test1.env')
        let manager = new DotEnvManager(testFilePath)
        await manager.init()
        let value = await manager.getVar('PRIMERAVARIABLE')
        expect(value).toBe('si')
    })

    it("Checks that _readVarFromLine parses correcly a variable", async () => {
        let input = 'TEST="test"'
        let { emptyLine, varName, varValue } = _readVarFromLine(input, 1, '')
        expect(emptyLine).toBe(false)
        expect(varName).toBe('TEST')
        expect(varValue).toBe('test')
    })

    it("Checks that _readVarFromLine parses correctly a variable with escaped quotes", () => {
        let input = 'TEST="a \\"quoted\\" string"'
        const { varName, varValue } = _readVarFromLine(input, 1, 'test.env')
        expect(varName).toBe('TEST')
        expect(varValue).toBe('a \\"quoted\\" string')
    })

    it("Checks that _readVarFromLine parses correctly a variable with end line comment", async () => {
        let input = 'TEST="test#" # un comentario'
        const { varName, varValue } = _readVarFromLine(input, 1, 'test.env')
        expect(varName).toBe('TEST')
        expect(varValue).toBe('test#')
    })

    it("Checks that _readVarFromLine parses correctly a variable with end line comment and cuotes on the comment", async () => {
        let input = 'TEST="te\\"st#" # un \'comentario"\''
        const { varName, varValue } = _readVarFromLine(input, 1, 'test.env')
        expect(varName).toBe('TEST')
        expect(varValue).toBe('te\\"st#')
    })

    it("Checks that _readVarFromLine parses correcly a comment", async () => {
        let input = '# un comentario'
        let { emptyLine, varValue } = _readVarFromLine(input, 1, '')
        expect(emptyLine).toBe(true)
        expect(varValue).toBe('comment')
    })

    it("Checks that _readVarFromLine parses correcly a empty space", async () => {
        let input = ''
        let { emptyLine, varValue } = _readVarFromLine(input, 1, '')
        expect(emptyLine).toBe(true)
        expect(varValue).toBe('emptySpace')
    })

    it("Checks that _readVarFromLine error on incorrecly formed variables", async () => {
        let input = 'TEST'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: Variable inválida.'))
        
        input = 'TEST='
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: nombre o variable vacíos.'))

        input = 'TEST="test'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: delimitadores de variable inválidos.'))

        input = '="test'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: nombre o variable vacíos.'))
    })

    it("Checks that _readVarFromLine throws an error on invalid variable names", async () => {
        let input = '1TEST="test"'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: Nombre inválido.'))

        input = 'TEST-VAR="test"'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: Nombre inválido.'))

        input = 'TEST.VAR="test"'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: Nombre inválido.'))

        input = '123="test"'
        expect(() => _readVarFromLine(input, 1, '')).toThrow(new Error('Error de sintaxis: Nombre inválido.'))
    })
})

describe("DotEnvManager writeVar tests", () => {
    it("Checks that writeVar updates an existing variable correctly", async () => {
        const initialContent = `MY_VAR="initial_value"${EOL}ANOTHER_VAR="another_value"`
        const testFilePath = createFileWithContent(initialContent)
        const manager = new DotEnvManager(testFilePath)
        await manager.init()

        expect(await manager.getVar('MY_VAR')).toBe('initial_value')
        expect(await manager.getVar('ANOTHER_VAR')).toBe('another_value')

        await manager.writeVar('MY_VAR', 'new_value')

        let fileContent = readFileSync(testFilePath, 'utf-8')
        expect(fileContent).toBe(`MY_VAR="new_value"${EOL}ANOTHER_VAR="another_value"`)
        expect(await manager.getVar('MY_VAR')).toBe('new_value')
        expect(await manager.getVar('ANOTHER_VAR')).toBe('another_value')

        await manager.writeVar('ANOTHER_VAR', 'new_value')

        fileContent = readFileSync(testFilePath, 'utf-8')
        expect(fileContent).toBe(`MY_VAR="new_value"${EOL}ANOTHER_VAR="new_value"`)
        expect(await manager.getVar('MY_VAR')).toBe('new_value')
        expect(await manager.getVar('ANOTHER_VAR')).toBe('new_value')
    })

    it("Checks that writeVar creates a new variable correctly when createIfNotExists is true", async () => {
        const initialContent = `EXISTING_VAR="value"`
        const testFilePath = createFileWithContent(initialContent)
        const manager = new DotEnvManager(testFilePath)
        await manager.init()

        await manager.writeVar('NEW_VAR', 'new_value', true)

        const fileContent = readFileSync(testFilePath, 'utf-8')
        expect(fileContent).toBe(`EXISTING_VAR="value"${EOL}NEW_VAR="new_value"`)
        expect(await manager.getVar('EXISTING_VAR')).toBe('value')
        expect(await manager.getVar('NEW_VAR')).toBe('new_value')
    })

    it("Checks that writeVar throws an error when attempting to write to a non-existent variable without createIfNotExists", async () => {
        const initialContent = `MY_VAR="value"`
        const testFilePath = createFileWithContent(initialContent)
        const manager = new DotEnvManager(testFilePath)
        await manager.init()

        await expectAsync(manager.writeVar('NON_EXISTENT', 'value')).toBeRejectedWith(
            new Error('Intento de sobrescribir una variable inexistente.', {
                cause: `La variable "NON_EXISTENT" no existe. No se puede sobreescribir. Error en el archivo "${testFilePath}".`
            })
        )
    })
})

afterAll(async () => {
    // eliminar los archivos extra creados
    for (let file of extraFiles) {
        unlinkSync(file)
    }
})