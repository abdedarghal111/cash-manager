/**
 * Clase que representa un monto de dinero en metálico
 * Está creada con el propósito de facilitar las operaciones con montos en metálico
 * 
 * IMPORTANTE: considerar que está pensada para que también el monto pueda quedar negativo pero NO se puede ni debe guardar siendo negativo
 * TODO: convertir a una clase meramente estática para hacer operaciones con objetos AcceptedCashValues (así ahorrar crear clases etc)
*/
import { AcceptedCashEquivalent, validCashValues, validCashStrings, AcceptedCashValues, AcceptedCashIterable } from "@data/enums/AcceptedCashEquivalent.mjs"
import { Validator } from "@single/Validator.mjs"
import Decimal from "decimal.js"

/**
 * Cash array type, un tipo que coloca los billetes dentro de un array para manejarlos de manera eficiente
 * Se ve tal que así: [cashKey, cashValue, cashCuantity][]
 */
export type CashArrayType = [keyof AcceptedCashValues, typeof AcceptedCashEquivalent[keyof AcceptedCashValues], number][]

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
     * Devuelve un objeto AcceptedCashValues vacío
     */
    public static getEmptyCashArray() {
        return {
            cincuenta: 0,
            veinte: 0,
            diez: 0,
            cinco: 0,
            dos: 0,
            uno: 0,
            cerocincuenta: 0,
            ceroveinte: 0,
            cerodiez: 0,
            cerocinco: 0,
            cerodos: 0,
            cerouno: 0,
        } 
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
            throw new Error(`La cantidad ${cuantity} debe ser un numero entero.`) 
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
            throw new Error(`La cantidad ${cuantity} debe ser un numero entero.`) 
        }

        // comprobar si el existe en la tabla de equivalencias
        let findedIndex = validCashStrings.find(val => val === cashString)
        if (findedIndex) {
            this[cashString as keyof AcceptedCashValues] = cuantity
        } else {
            throw new Error(`El string ${cashString} no es un billete o moneda válido`)
        }
    }

    /**
     * Devuelve el total de un bundle
     */
    public static getBundleTotal(bundle: AcceptedCashValues) {
        // contar todo el cash
        let total = new Decimal(0)

        for (let [cashKey, cashValue] of AcceptedCashIterable) {
            // sacar cantidad de billetes
            let cashCuantity = bundle[cashKey]
            // multiplicar cantidad por valor
            let totalValue = new Decimal(cashValue).mul(cashCuantity)
            // sumar al total
            total = total.add(totalValue)
        }

        // devolver el total de todo
        return total.toNumber()
    }

    /**
     * Devuelve el valor total del monto
     */
    public getTotal(): number {
        return CashBundle.getBundleTotal(this)
    }

    /**
     * Suma un AcceptedCashValues al bundle
     */
    public sumMonto(object: AcceptedCashValues): this {
        this.cincuenta += object.cincuenta
        this.veinte += object.veinte
        this.diez += object.diez
        this.cinco += object.cinco
        this.dos += object.dos
        this.uno += object.uno
        this.cerocincuenta += object.cerocincuenta
        this.ceroveinte += object.ceroveinte
        this.cerodiez += object.cerodiez
        this.cerocinco += object.cerocinco
        this.cerodos += object.cerodos
        this.cerouno += object.cerouno

        return this
    }

    /**
     * Resta un AcceptedCashValues al bundle
     */
    public subMonto(object: AcceptedCashValues): this {
        this.cincuenta -= object.cincuenta
        this.veinte -= object.veinte
        this.diez -= object.diez
        this.cinco -= object.cinco
        this.dos -= object.dos
        this.uno -= object.uno
        this.cerocincuenta -= object.cerocincuenta
        this.ceroveinte -= object.ceroveinte
        this.cerodiez -= object.cerodiez
        this.cerocinco -= object.cerocinco
        this.cerodos -= object.cerodos
        this.cerouno -= object.cerouno

        return this
    }

    /**
     * Devuelve una copia del monto
     */
    public cloneMonto(): CashBundle {
        return CashBundle.importFromValidAcceptedCashValues(this)
    }

    // /**
    //  * Suma un monto a al bundle
    //  */
    // public sumMonto(monto: Monto): void {
    //     this.cincuenta = new Decimal(this.cincuenta).add(monto.cincuenta).toNumber()
    //     this.veinte = new Decimal(this.veinte).add(monto.veinte).toNumber()
    //     this.diez = new Decimal(this.diez).add(monto.diez).toNumber()
    //     this.cinco = new Decimal(this.cinco).add(monto.cinco).toNumber()
    //     this.dos = new Decimal(this.dos).add(monto.dos).toNumber()
    //     this.uno = new Decimal(this.uno).add(monto.uno).toNumber()
    //     this.cerocincuenta = new Decimal(this.cerocincuenta).add(monto.cerocincuenta).toNumber()
    //     this.ceroveinte = new Decimal(this.ceroveinte).add(monto.ceroveinte).toNumber()
    //     this.cerodiez = new Decimal(this.cerodiez).add(monto.cerodiez).toNumber()
    //     this.cerocinco = new Decimal(this.cerocinco).add(monto.cerocinco).toNumber()
    //     this.cerodos = new Decimal(this.cerodos).add(monto.cerodos).toNumber()
    //     this.cerouno = new Decimal(this.cerouno).add(monto.cerouno).toNumber()
    // }

    /**
     * Devuelve un array [cashKey, cashValue, cashCuantity] con solo los billetes con cantidad diferente a 0
     */
    public getNonEmptyCashArray(): CashArrayType {
        // convertir 
        let keyValueArray = [] as CashArrayType

        for (let [cashKey, cashValue] of AcceptedCashIterable) {
            // sacar cantidad de billetes
            let cashCuantity = this[cashKey]
            // si la cantidad no es 0 entonces añadir al array
            if (cashCuantity !== 0) {
                keyValueArray.push([cashKey, cashValue, cashCuantity])
            }
        }

        return keyValueArray
    }

    /**
     * Devuelve si el cashBundle está vacio
     */
    public isEmpty(): boolean {
        switch (true) {
            case this.cincuenta !== 0:
                return false
            case this.veinte !== 0:
                return false
            case this.diez !== 0:
                return false
            case this.cinco !== 0:
                return false
            case this.dos !== 0:
                return false
            case this.uno !== 0:
                return false
            case this.cerocincuenta !== 0:
                return false
            case this.ceroveinte !== 0:
                return false
            case this.cerodiez !== 0:
                return false
            case this.cerocinco !== 0:
                return false
            case this.cerodos !== 0:
                return false
            case this.cerouno !== 0:
                return false
        }
        return true
    }

    /**
     * Devuelve si son dos AcceptedCashValues iguales
     */
    public equalsToMonto(monto: AcceptedCashValues): boolean {
        switch (true) {
            case this.cincuenta !== monto.cincuenta:
                return false
            case this.veinte !== monto.veinte:
                return false
            case this.diez !== monto.diez:
                return false
            case this.cinco !== monto.cinco:
                return false
            case this.dos !== monto.dos:
                return false
            case this.uno !== monto.uno:
                return false
            case this.cerocincuenta !== monto.cerocincuenta:
                return false
            case this.ceroveinte !== monto.ceroveinte:
                return false
            case this.cerodiez !== monto.cerodiez:
                return false
            case this.cerocinco !== monto.cerocinco:
                return false
            case this.cerodos !== monto.cerodos:
                return false
            case this.cerouno !== monto.cerouno:
                return false
        }
        return true
    }

    /**
     * Sobreescribe los valores del CashBundle con los de AcceptedCashValues introducidos
     */
    public setFromValidAcceptedCashValues(object: AcceptedCashValues) {
        this.cincuenta = object.cincuenta
        this.veinte = object.veinte
        this.diez = object.diez
        this.cinco = object.cinco
        this.dos = object.dos
        this.uno = object.uno
        this.cerocincuenta = object.cerocincuenta
        this.ceroveinte = object.ceroveinte
        this.cerodiez = object.cerodiez
        this.cerocinco = object.cerocinco
        this.cerodos = object.cerodos
        this.cerouno = object.cerouno

        return this
    }

    /**
     * Valida si la tabla introducida contiene todas las keys válidas {AcceptedCashValues} y los introduce a un nuevo CashBundle
     * Si hay error devuelve un string con el error
     */
    public static importFromTable(table: any): CashBundle | string {
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
     * Copia los valores de un AcceptedCashValues a un nuevo CashBundle
     * 
     * Esta función es para evitar las comprobaciones y así ser más eficiente cuando estamos seguros de que el monto es válido.
     */
    public static importFromValidAcceptedCashValues(object: AcceptedCashValues) {
        let newCashBundle = new CashBundle()

        newCashBundle.cincuenta = object.cincuenta
        newCashBundle.veinte = object.veinte
        newCashBundle.diez = object.diez
        newCashBundle.cinco = object.cinco
        newCashBundle.dos = object.dos
        newCashBundle.uno = object.uno
        newCashBundle.cerocincuenta = object.cerocincuenta
        newCashBundle.ceroveinte = object.ceroveinte
        newCashBundle.cerodiez = object.cerodiez
        newCashBundle.cerocinco = object.cerocinco
        newCashBundle.cerodos = object.cerodos
        newCashBundle.cerouno = object.cerouno

        return newCashBundle
    }
}