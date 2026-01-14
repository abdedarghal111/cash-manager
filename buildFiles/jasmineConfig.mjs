/**
 * Configuración de Jasmine para ejecutar los tests en el backend.
 */
import Jasmine from 'jasmine'
import c from 'colors'
import { TEST_OUT_PATH, TEST_PATH, ROOT_PATH } from './shared/paths.mjs'
import { join, parse, resolve } from 'path'
import { belongsToFolder, fail, fileExists, getInputParams, parsePath } from './shared/utility.mjs'

// obtener los parámetros introducidos
const args = getInputParams([
    ['f', 'file'],
    ['h', 'help']
])

// hecho con https://patorjk.com/software/taag (existen herramientas en terminal como https://github.com/cmatsuoka/figlet)
console.log(`
  _____         _                                      
 |_   _|__  ___| |_   _ __ _   _ _ __  _ __   ___ _ __ 
   | |/ _ \\/ __| __| | '__| | | | '_ \\| '_ \\ / _ \\ '__|
   | |  __/\\__ \\ |_  | |  | |_| | | | | | | |  __/ |   
   |_|\\___||___/\\__| |_|   \\__,_|_| |_|_| |_|\\___|_|
`.green)

let helpMessage = 
`
Antes de usar el test runner, se debe de compilar el proyecto.
Cuando se ejecuta el runner, busca los tests dentro de "${TEST_OUT_PATH}" y los
ejecuta usando Jasmine.

${`Modificadores de comportamiento:`.blue}
    ${`-f`.yellow} o ${`--file`.yellow}: Ejecuta un solo los archivos que coloques de test en lugar de todos.
        Por ejemplo:
            ${`jasmineRunner.js -f ./test/class/LineByLineBuffer.spec.mts -f ./test/class/model/cuenta.spec.mts`.green}

    ${`-h`.yellow} o ${`--help`.yellow}:  Muestra este mensaje de ayuda.

${``.green}
`.white

// si se ha introducido --help entonces mostrar mensaje de ayuda
if (args['help']) {
    console.log(helpMessage)
    process.exit(0)
}

// variable que contiene los archivos a ejecutar si se han introducido por consola
let customFiles = false
// revisar si existen y recoger los files
if (args['file']) {
    customFiles = []
    for (let path of args['file']) {
        // analizar el path
        let { isValid, isAbsolute } = parsePath(path)

        if (!isValid) {
            fail(`\n==> El archivo "${path}" no es un directorio o archivo válido.`)
        }

        if (!isAbsolute) {
            // añadir al root del proyecto
            path = join(ROOT_PATH, path)
        }

        // probar que pertenezca a la carpeta test
        let { isInside, relativePath } = belongsToFolder(TEST_PATH, path)
        if (!isInside) {
            fail(`\n==> El archivo "${path}" no pertenece a la carpeta de tests: ${TEST_PATH}`)
        }

        // si es root entonces añadir así y probar
        let { exists, isFile } = fileExists(path)
        if (!exists) {
            fail(`\n==> El archivo "${path}" no existe.`)
        }

        if (!isFile) {
            fail(`\n==> La ruta "${path}" no es un archivo.`)
        }

        // si no es un test
        if (!path.endsWith('.spec.mts')) {
            fail(`\n==> El archivo "${path}" no tiene la extensión adecuada para ser un test: .spec.mjs`)
        }

        // sobreescribir a la ruta de build
        path = path.replace(TEST_PATH, TEST_OUT_PATH).replace('.spec.mts', '.spec.mjs')
        customFiles.push(path)
    }

    if (customFiles.length === 0) {
        fail(`\n==> El argumento --file o -f no puede ir vacío.`)
    }
}

console.log('\n==> Iniciando tests\n'.green)

const runner = new Jasmine()
runner.env.clearReporters()
runner.env.addReporter({
    jasmineStarted: function (suiteInfo) {
        console.log(`\n==> Ejecutando ${suiteInfo.totalSpecsDefined} tests`.green);
    },

    suiteStarted: function (result) {
        console.log('\n===> ' + c.yellow(result.fullName))
        console.log('------------------------------------------------------------------------'.black)
    },

    specStarted: async function (result) {
        // console.log(' ---> ' + c.green(result.description))
    },

    specDone: function (result) {
        // console.log(`----------- ${result.status} ---------------`)
        if (result.status === 'passed') {
            console.log(' ---> ' + c.green(result.description + ' .OK'))
        } else if (result.status === 'failed') {
            console.log(' ---> ' + c.red(result.description + ' .FAIL'))
        }

        for (const expectation of result.failedExpectations) {
            console.log('------------------------------------------------------------------------'.black)
            console.log('        !-> Fallo: ' + expectation.message.yellow)
            console.log('        !-> En línea: ' + expectation.stack.trim().red)
        }
        console.log('------------------------------------------------------------------------'.black)

        // console.log(result.passedExpectations.length);
    },

    suiteDone: function (result) {
        // console.log('Suite: ' + result.description + ' was ' + result.status);
        // for (const expectation of result.failedExpectations) {
        //         console.log('Suite ' + expectation.message);
        //         console.log(expectation.stack);
        // }
    },

    jasmineDone: function (result) {
        // console.log('Finished suite: ' + result.overallStatus);
        // for (const expectation of result.failedExpectations) {
        //         console.log('Global ' + expectation.message);
        //         console.log(expectation.stack);
        // }
    }
})

let spec_files = [
    resolve(TEST_OUT_PATH, '**/*.[sS]pec.?(m)js')
]

if (customFiles) {
    spec_files = customFiles
    for (let path of customFiles) {
        console.log(`==> Añadiendo test: ${path}`.yellow)
    }
}

runner.loadConfig({
    spec_files: spec_files,
    jsLoader: 'import',
    stopOnSpecFailure: false,
    random: false
})

runner.exitOnCompletion = false

const result = await runner.execute()

// console.log(`\n==> Tiempo tardado: ${result.totalTime/1000} segundos.\n`.gray)
if (result.overallStatus === 'passed') {
    console.log('\n==> Todos los test están OK\n'.green)
} else {
    console.log(`\n==> Han fallado algunos tests\n`.yellow)
}

console.log('\n==> Cadena de testeo finalizada\n'.green)

if (result.overallStatus !== 'passed') {
    process.exit(1)
}