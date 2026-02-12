/**
 * Clase Monto, representa un monto o conjunto de dinero 
 */
import { CashArrayType, CashBundle } from "@class/CashBundle.mjs"
import { AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"
import { Model, Op, Transaction } from "sequelize"
import { User } from "@class/model/User.server.mts"
import { Subcuenta } from "./Subcuenta.server.mts"
import { Cuenta } from "./Cuenta.server.mts"
import Decimal from "decimal.js"

export class Monto extends Model implements AcceptedCashValues {
    declare id: number

    // metálico
    declare cincuenta: number
    declare veinte: number
    declare diez: number
    declare cinco: number
    declare dos: number
    declare uno: number
    declare cerocincuenta: number
    declare ceroveinte: number
    declare cerodiez: number
    declare cerocinco: number
    declare cerodos: number
    declare cerouno: number

    /**
     * pone a cero el dinero en metálico
     */
    clearCash(): void {
        this.cincuenta = 0
        this.veinte = 0
        this.diez = 0
        this.cinco = 0
        this.dos = 0
        this.uno = 0
        this.cerocincuenta = 0
        this.ceroveinte = 0
        this.cerodiez = 0
        this.cerocinco = 0
        this.cerodos = 0
        this.cerouno = 0
    }

    /**
     * Establecer el monto de un cashBundle a este monto
     */
    setFromCashBundle(bundle: CashBundle): void {
        this.cincuenta = bundle.cincuenta
        this.veinte = bundle.veinte
        this.diez = bundle.diez
        this.cinco = bundle.cinco
        this.dos = bundle.dos
        this.uno = bundle.uno
        this.cerocincuenta = bundle.cerocincuenta
        this.ceroveinte = bundle.ceroveinte
        this.cerodiez = bundle.cerodiez
        this.cerocinco = bundle.cerocinco
        this.cerodos = bundle.cerodos
        this.cerouno = bundle.cerouno
    }

    /**
     * Devuelve el total de dinero en metálico sin revisarlo en la base de datos
     */
    getCurrentTotal(): number {
        let bundle = CashBundle.importFromValidAcceptedCashValues(this)
        return bundle.getTotal()
    }

    /**
     * Devuelve un array [keyBillete, valor, cantidad] con los billetes que tienen cantidad 
     */
    exportNonEmptyCashArray(): CashArrayType {
        return CashBundle.importFromValidAcceptedCashValues(this).getNonEmptyCashArray()
    }

    /**
     * Extrae los billetes a un cashBundle, se coloca a cero y devuelve el cash bundle
     */
    extractMoneyToCashBundle(): CashBundle {
        let bundle = CashBundle.importFromValidAcceptedCashValues(this)
        this.clearCash()
        return bundle
    }

    /**
     * Mueve el metálico de un monto de A a B y vacía A
     */
    moveCashTo(montoB: Monto) {
        montoB.cincuenta += this.cincuenta
        montoB.veinte += this.veinte
        montoB.diez += this.diez
        montoB.cinco += this.cinco
        montoB.dos += this.dos
        montoB.uno += this.uno
        montoB.cerocincuenta += this.cerocincuenta
        montoB.ceroveinte += this.ceroveinte
        montoB.cerodiez += this.cerodiez
        montoB.cerocinco += this.cerocinco
        montoB.cerodos += this.cerodos
        montoB.cerouno += this.cerouno

        this.clearCash()
    }

    /**
     * Devuelve una tabla AcceptedCashValues
     */
    toAcceptedCashValues(): AcceptedCashValues {
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
            cerouno: this.cerouno
        }
    }

    /**
     * Inserta los billetes desde el mayor a menor en el monto (algoritmo por defecto)
     * 
     * IMPORTANTE: modifica el array introducido (restando el cash movido)
     * 
     * @returns el valor total de los billetes usados
     */
    insertCashArray(cashArray: CashArrayType, pendingTotal: number): number {
        let totalInserted = new Decimal(0) // el total insertado
        let totalRemaining = new Decimal(pendingTotal) // el restante que falta

        // empezar desde el billete más grande (es así por defecto)
        for (let arrayRow of cashArray) {
            let [cashKey, cashValue, cashCuantity] = arrayRow

            // sacar el maximo valor posible a insertar
            let maxInsertValue = Decimal.mul(cashValue, cashCuantity)
            let cuantityToInsert = 0

            // si el totalPendiente es mayor a lo que se puede insertar
            if (totalRemaining.greaterThanOrEqualTo(maxInsertValue)) {
                // insertar todos los billetes
                cuantityToInsert = cashCuantity
            } else {
                // insertar solo los que se puedan floor(totalValor/valorBillete)
                let idealToInsert = totalRemaining.div(cashValue).floor().toNumber()
                // insertar solo disponible
                // si tengo pocos billetes pero puedo insertar más: insertar solo los pocos
                // si tengo muchos billetes pero no se pueden insertar más: insertar solo lo posible
                cuantityToInsert = Math.min(idealToInsert, cashCuantity)
            }

            // insertar billetes
            this[cashKey] += cuantityToInsert
            // descontar de cashArray
            arrayRow[2] -= cuantityToInsert

            // registrar valor insertado
            let valueInserted = new Decimal(cashValue).mul(cuantityToInsert)
            totalInserted = totalInserted.add(valueInserted)
            // descontar del pendiente
            totalRemaining = totalRemaining.sub(valueInserted)

            // comprobar que se puede ingresar antes de ingresar
            if (totalRemaining.equals(0)) {
                return totalInserted.toNumber()
            }
        }

        return totalInserted.toNumber()
    }

    /**
     * Redistribuye los billetes a los montos de las cuentas pasadas por parámetro
     */
    async reallocateCashToSubaccounts(user: User, accounts: Cuenta[], transaction?: Transaction): Promise<[
        account: Cuenta,
        subAccount: Subcuenta,
        monto: Monto,
        beforeCash: CashBundle,
        afterCash: CashBundle
    ][]> {

        // obtener todas las subcuentas-monto pendientes
        let EverySubaccountMonto = [] as [
            account: Cuenta,
            subAccount: Subcuenta,
            monto: Monto,
            beforeCash: CashBundle,
            afterCash: CashBundle
        ][]

        // para cada cuenta
        for (let account of accounts) {
            // obtener subcuentas que tengan pendiente
            let subaccounts = await Subcuenta.findAll({
                where: {
                    cuenta: account.id,
                    cashPending: {
                        [Op.not]: 0
                    }
                },
                transaction: transaction
            })

            // dentro de cada subcuenta
            for (let subaccount of subaccounts) {

                // obtener su monto
                let monto = await subaccount.getMonto(transaction)
                // registrar
                EverySubaccountMonto.push([
                    account,
                    subaccount,
                    monto,
                    CashBundle.importFromValidAcceptedCashValues(monto),
                    new CashBundle() // rellenar abajo
                ])

                // vaciar todos los montos
                monto.moveCashTo(this)
                // poner total pendiente a total
                subaccount.cashPending = subaccount.total
            }
        }

        // obtener el metálico disponible
        let cashArray = this.exportNonEmptyCashArray()

        for (let [ account, subAccount, monto, beforeCash, afterCash ] of EverySubaccountMonto) {

            // rellenar subcuenta vía el método por defecto
            // Idea: podría en vez de ir monto por monto, loopear todos los montos con cada tipo de billete (otro punto de vista)
            // console.log(`CashArray va a cambiarse:`)
            // console.log(cashArray)
            // console.log(`Monto ${account.name} va a ser rellenado:`)
            // console.log(CashBundle.importFromValidAcceptedCashValues(monto))
            let totalFilled = monto.insertCashArray(cashArray, subAccount.cashPending)
            // console.log(`Monto ${account.name} despues de ser rellenado:`)
            // console.log(CashBundle.importFromValidAcceptedCashValues(monto))
            cashArray = cashArray.filter(([cashKey, cashValue, cashCuantity]) => cashCuantity !== 0)
            // console.log(`CashArray cambiado:`)
            // console.log(cashArray)

            // restar el completado al cash pendiente
            subAccount.cashPending = Decimal.sub(subAccount.cashPending, totalFilled).toNumber()

            // sacar el dinero de después
            afterCash.setFromValidAcceptedCashValues(monto)

            // guardar monto y subcuenta
            await monto.save({ transaction: transaction })
            await subAccount.save({ transaction: transaction })
        }

        // guardar el monto actual con el sobrante
        this.clearCash()
        for (let [cashKey, cashValue, cashCuantity] of cashArray) {
            this[cashKey] = cashCuantity
        }

        return EverySubaccountMonto
    }
}