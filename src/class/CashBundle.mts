/**
 * Clase que representa un monto de dinero en metálico
 * Está creada con el propósito de facilitar las operaciones con montos en metálico
 */
import { AcceptedCashEquivalent, validCashValues, validCashStrings, AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"
import { Validator } from "@single/Validator.mjs"

export class CashBundle {

    // metálico
    public cincuenta = 0
    public veinte = 0
    public diez = 0
    public cinco = 0
    public dos = 0
    public uno = 0
    public cerocincuenta = 0
    public ceroveinte = 0
    public cerodiez = 0
    public cerocinco = 0
    public cerodos = 0
    public cerouno = 0

    /**
     * Valida si la tabla introducida contiene todas las keys válidas {AcceptedCashValues} y los introduce a un nuevo CashBundle
     * Si hay error devuelve un string con el error
     */
    static importFromTable(table: any): CashBundle | string {
        if (!table) {
            return "No se proporcionó el monto"
        }

        // validar tabla
        if (typeof table !== 'object') {
            return 'El monto ingresado no es un objeto válido'
        }

        // inicializar el bundle
        let newCashBundle = new CashBundle()

        // validar cada uno de los valores
        for (let keyCash of Object.keys(AcceptedCashEquivalent) as Array<keyof AcceptedCashValues>) {
            let number = Validator.int(table[keyCash])
            if (Validator.isNotValid(number) || number < 0) {
                // si algun valor no es válido devolver
                return `El monto ingresado para ${AcceptedCashEquivalent[keyCash]} no es válido`
            }
            // ingresar solo los valores que nos interesan
            newCashBundle[keyCash] = number
        }

        return newCashBundle
    }

    /**
     * Exporta a una tabla AcceptedCashValues con los valores en su interior
     */
    public exportToAcceptedCashValues(): AcceptedCashValues {
        return {
            cincuenta: this.cincuenta,
            veinte: this.veinte,
            diez: this.diez,
            cinco: this.cinco,
            dos: this.dos,
            uno: this.uno,
            cerocincuenta: this.cerocincuenta,
            ceroveinte: this.ceroveinte,
            cerodiez: this.cerodiez,
            cerocinco: this.cerocinco,
            cerodos: this.cerodos,
            cerouno: this.cerouno,
        }
    }

    /**
     * Establece la cantidad indicada al valor monetario que le indiques
     * 
     * Por ejemplo: setCash(0.50, 3) o setCash(20, 5)
     * 
     * En general setCash(${valor del billete o moneda}, cantidad)
     * 
     * Lanza una excepción si el valor monetario no es válido
     * @param {number} tipo - El valor monetario a establecer: 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01 (establecidos en validCashValues)
     * @param {number} cantidad - La cantidad que se desea establecer para ese valor
     * @throws {Error} Si el valor monetario es inválido

     */
    public setCash(cashValue: number, cuantity: number) {
        
        // comprobar si la cantidad es válida
        if (Validator.isNotValid(Validator.int(cuantity))) {
            throw new Error(`La cantidad ${cuantity} debe ser mayor o igual a 0 y ser un numero entero.`) 
        }

        // comprobar si el value es un valor válido
        let findedIndex = validCashValues.find(val => val === cashValue)
        if (findedIndex) {
            let cashValueKey = validCashStrings[findedIndex]!
            AcceptedCashEquivalent[cashValueKey] = cuantity
        } else {
            throw new Error(`El valor ${cashValue} no es un valor de billete o moneda válido`)
        }
    }

    /**
     * Establece la cantidad indicada al string monetario que le indiques
     * 
     * Por ejemplo: setCash("cincuenta", 3) o setCash("veinte", 5)
     * 
     * En general setCash(${string del billete}, cantidad)
     * 
     * Lanza una excepción si el valor monetario no es válido
     * @param {string} tipo - El valor monetario a establecer (establecidos en validCashValues)
     * @param {number} cantidad - La cantidad que se desea establecer para ese valor
     * @throws {Error} Si el valor monetario es inválido

     */
    public setStringCash(cashString: string, cuantity: number) {

        // comprobar si la cantidad es válida
        if (Validator.isNotValid(Validator.int(cuantity))) {
            throw new Error(`La cantidad ${cuantity} debe ser mayor o igual a 0 y ser un numero entero.`) 
        }

        // comprobar si el existe en la tabla de equivalencias
        let findedIndex = validCashStrings.find(val => val === cashString)
        if (findedIndex) {
            this[cashString as keyof AcceptedCashValues] = cuantity
        } else {
            throw new Error(`El string ${cashString} no es un billete o moneda válido`)
        }
    }
}