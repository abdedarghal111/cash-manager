/**
 * Configuración de Jasmine para ejecutar los tests en el backend.
 */
import Jasmine from 'jasmine'
import c from 'colors'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __test = path.resolve(__dirname, '..', 'dist', 'backend', 'test')

console.log('\n==> Iniciando tests\n'.green)

const runner = new Jasmine()
runner.env.clearReporters()
runner.env.addReporter({
  jasmineStarted: function(suiteInfo) {
    console.log(`\n==> Ejecutando ${suiteInfo.totalSpecsDefined} tests`.green);
  },

  suiteStarted: function(result) {
    console.log('\n===> ' + c.yellow(result.fullName))
    console.log('------------------------------------------------------------------------'.black)
  },

  specStarted: async function(result) {
    // console.log(' ---> ' + c.green(result.description))
  },

  specDone: function(result) {
    // console.log(`----------- ${result.status} ---------------`)
    if(result.status === 'passed'){
      console.log(' ---> ' + c.green(result.description + ' .OK'))
    }else if(result.status === 'failed'){
      console.log(' ---> ' + c.red(result.description + ' .FAIL'))
    }

    for (const expectation of result.failedExpectations) {
      console.log('------------------------------------------------------------------------'.black)
      console.log('  !-> Fallo: ' + expectation.message.yellow)
      // console.log(expectation.stack);
    }
    console.log('------------------------------------------------------------------------'.black)

    // console.log(result.passedExpectations.length);
  },

  suiteDone: function(result) {
    // console.log('Suite: ' + result.description + ' was ' + result.status);
    // for (const expectation of result.failedExpectations) {
    //   console.log('Suite ' + expectation.message);
    //   console.log(expectation.stack);
    // }
  },

  jasmineDone: function(result) {
    // console.log('Finished suite: ' + result.overallStatus);
    // for (const expectation of result.failedExpectations) {
    //   console.log('Global ' + expectation.message);
    //   console.log(expectation.stack);
    // }
  }
})

runner.loadConfig({
  spec_files: [
    path.join(__test, '**/*.[sS]pec.?(m)js').replace(/\\/g, '/')
  ],
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