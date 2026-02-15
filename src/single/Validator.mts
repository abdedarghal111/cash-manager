/**
 * Clase para validar y sanear datos en el cliente y servidor.
 * 
 * Si algun dato no es válido se devuelve `InvalidValidation`.
 * 
 * Si una función solo es el nombre significa Validar (solo comprobar si el tipo de variable y estructura son correctos)
 * Pero si pone "parse" al inicio entonces significa que filtrará la variable para convertirla en ese valor (si es posible)
 */

export const InvalidValidation = Symbol("InvalidValidation")
export type ValidatorResult<T> = T | typeof InvalidValidation

/**
 * @class Validator
 * @description Proporciona métodos estáticos para la validación y filtración de datos.
 */
export class Validator {

    // refresqué mi memoria de regex con esta página https://regexlearn.com/learn (recomendada: 45 minutos interactivos)
    // regex que comprueba que exista desde 1 a 3 dígitos en cada X de "X.X.X" de inicio (^) a fin de linea ($) y en modo single line (s)
    public static VERSION_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/s

    /**
     * Comprueba si un dato validado no es válido.
     * @param data Dato a comprobar.
     * @returns `true` si no es válido.
     */
    public static isNotValid(data: any): data is typeof InvalidValidation {
        return data === InvalidValidation
    }

    /**
     * Valida si la entrada es un dato de tipo booleano.
     * @param data Entrada a validar.
     * @returns `true` si es un booleano.
     */
    public static boolean(data: any): ValidatorResult<boolean> {
        // si es booleano devolver el booleano osino not valid
        if (typeof data === 'boolean') {
            return data
        }
        
        return InvalidValidation
    }

    /**
     * Parsea un string a un booleano y lo devuelve si es válido.
     * @param data Entrada a parsear.
     * @returns `true` o `false` si es un string que representa un booleano, de otro modo `InvalidValidation`.
     */
    public static parseBoolean(data: any): ValidatorResult<boolean> {
        // si no es un string entonces inválido
        if (typeof data !== 'string') {
            return InvalidValidation
        }

        // entonces solo tiene que ser identico a true o false
        const lowerData = data.toLowerCase()
        
        if (lowerData === 'true') {
            return true
        }

        if (lowerData === 'false') {
            return false
        }
            
        // es otro string diferente
        return InvalidValidation
    }

    /**
     * Valida si la entrada es un número.
     * @param data Entrada a validar.
     * @returns El número o InvalidValidation.
     */
    public static number(susNumber: any): ValidatorResult<number> {
        if (typeof susNumber === 'number' && !isNaN(susNumber)) {
            return susNumber
        }

        return InvalidValidation
    }

    /**
     * Filtra un dato a un número.
     * @param data Entrada a filtrar.
     * @returns El número o InvalidValidation.
     */
    public static parseNumber(data: any): ValidatorResult<number> {
        // si es un número entonces validarlo
        if(typeof data === 'number') {
            return this.number(data)
        }

        // si tampoco es un string entonces no es valido
        if(typeof data !== 'string') {
            return InvalidValidation
        }

        // limpiar el string
        let outData = this.parseWhiteListString(data)

        // parsear el número
        const num = Number(outData)

        // si es NaN entonces no es valido
        if (isNaN(num)) {
            return InvalidValidation
        }

        // devolver el número si está todo correcto
        return num
    }

    /**
     * Valida si la entrada es un número entero.
     * @param data Entrada a validar.
     * @returns El entero o InvalidValidation.
     */
    public static int(data: any): ValidatorResult<number> {
        // validar que es un número primero
        let outNumber = this.number(data)
        if (this.isNotValid(outNumber)) {
            return outNumber
        }

        if (!Number.isInteger(outNumber)) {
            return InvalidValidation
        }

        return outNumber
    }

    /**
     * Filtra un dato a un entero.
     * @param data Entrada a filtrar.
     * @returns El entero o InvalidValidation.
     */
    public static parseInt(data: any): ValidatorResult<number> {
        // si no es ni un número ni un string entonces no es valido
        if(typeof data !== 'string' && typeof data !== 'number') {
            return InvalidValidation
        }

        // limpiar el string si es un string
        let outNumber = ""
        if (typeof data === 'string') {
            outNumber = this.parseWhiteListString(data)
        } else {
            // si es un número convertir a string
            outNumber = String(data)
        }
        
        // parsear el int
        let parsedInt = Number.parseInt(outNumber, 10)

        // si es NaN fuera
        if (isNaN(parsedInt)) {
            return InvalidValidation
        }

        // devolver el int si todo va bien
        return parsedInt
    }

    /**
     * Valida y LIMPIA si la entrada es una cadena de texto no vacía.
     * @param data Entrada a validar.
     * @returns La cadena de texto o InvalidValidation.
     */
    public static string(data: any): ValidatorResult<string> {
        if (typeof data !== 'string') {
            return InvalidValidation
        }
        
        // limpiar string
        const str = data.trim()

        // si está vacía entonces no es valido
        if (str === '') {
            return InvalidValidation
        }

        // devolver el resultado
        return str
    }

    /**
     * Filtrado de cadenas de texto de manera selectiva.
     * Elimina cualquier carácter que NO sea una letra, un número, un acento en español o un signo de puntuación básico, y finalmente limpia los espacios sobrantes al inicio y al final.
     * @param str Entrada a filtrar.
     * @returns La cadena de texto filtrada.
     */
    public static parseWhiteListString(str: string): string {
        return str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"").trim()
    }

    /**
     * Comprobar si es una versión válida osea: "X.X.X" siendo X un número unsigned de máximo 3 dígitos.
     * @param version Entrada a validar.
     * @returns La cadena de texto con la versión o InvalidValidation.
     */
    public static version(inputVersion: any): ValidatorResult<string> {
        // comprobar si es un string
        if (typeof inputVersion !== 'string') {
            return InvalidValidation
        }

        // comprobar que cumple con el regex de versiones
        if (!this.VERSION_REGEX.test(inputVersion)) {
            return InvalidValidation
        }

        // devolverlo
        return inputVersion
    }
}