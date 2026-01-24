/**
 * Clase encargada de mostrar reportes de manera visual y entendible
 */
import colors from "colors/safe.js"
import { EOL } from "os"

let levels = {
    [-4]: {
        text: '--> Cons.error -> ',
        color: colors.white('--> ') + colors.red('Cons.error ') + colors.white('-- ')
    },
    [-3]: {
        text: '--> Cons.warn -> ',
        color: colors.white('--> ') + colors.yellow('Cons.warn ') + colors.white('-- ')
    },
    [-2]: {
        text: '--> Cons.log -> ',
        color: colors.white('--> ') + colors.blue('Cons.log ') + colors.white('-- ')
    },
    [-1]: {
        text: '--> DB -> ',
        color: colors.white('--> ') + colors.yellow('DB ') + colors.white('-- ')
    },
    [1]: {
        text: '==> ',
        color: colors.white('==> ')
    },
    [2]: {
        text: '  -> ',
        color: colors.white('  -> ')
    }
}

// fin alteraciones

export class Logger {
    /**
     * Función interna genérica para imprimir un mensaje en el output de manera bonita
     */
    protected static logMessage(msg: string, subCommand: number, color: string)
    {
        // obtener tiempo pasado desde que inició la app
        let timeElapsed = this.getElapsedTime()+' '
        process.stdout.write(colors.grey(timeElapsed))

        // obtener tabulaciones
        let levelStr = levels[subCommand as keyof typeof levels]["color"]
        let length = levels[subCommand as keyof typeof levels]["text"].length

        process.stdout.write(levelStr)

        // hacer que en cada salto de linea tenga esos espacios extra
        let padding = ' '.repeat(timeElapsed.length + length)
        let transformedMsg = msg.replaceAll('\n', `\n${padding}`)

        // imprimir el mensaje con el color correspondiente y el salto de linea
        // @ts-ignore
        process.stdout.write(color === 'none' ? transformedMsg : colors[color](transformedMsg))
        process.stdout.write(EOL)
    }

    /**
     * Devuelve el tiempo desde que se inició la aplicación en formato [hh:mm:ss:ms]
     */
    protected static getElapsedTime() {
        const totalMiliseconds = Math.floor(performance.now())
        const totalSeconds = Math.floor(totalMiliseconds / 1000)
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
        const s = (totalSeconds % 60).toString().padStart(2, '0')
        const ms = (totalMiliseconds).toString().substring(0, 2).padStart(2, '0')
        return `[${h}:${m}:${s}:${ms}]`
    }

    static log(msg: string, subCommand = 1)
    {
        this.logMessage(msg, subCommand, 'none')
    }

    static info(msg: string, subCommand = 1)
    {
        this.logMessage(msg, subCommand, 'cyan')
    }

    static success(msg: string, subCommand = 1)
    {
        this.logMessage(msg, subCommand, 'green')
    }

    static warn(msg: string, subCommand = 1)
    {
        this.logMessage(msg, subCommand, 'yellow')
    }

    static error(msg: string, subCommand = 1)
    {
        this.logMessage(msg, subCommand, 'red')
    }

    /**
     * Modifica las funciones de console para que se vean como logs
     * altera console.log, console.warn y console.error
     */
    static async alterConsoleFunctions() 
    {
        console.log = (...data) => {
            Logger.info(data.join(', '), -2)
        }

        console.warn = (...data) => {
            Logger.warn(data.join(', '), -3)
        }

        console.error = (...data) => {
            Logger.error(data.join(', '), -4)
        }
    }
}