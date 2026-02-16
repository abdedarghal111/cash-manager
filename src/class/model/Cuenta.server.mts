/**
 * Clase Cuenta, representa una cuenta que contendrá varias subcuentas y que pertenecerá a un usuario.
 */
import { Model, Transaction } from "sequelize"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { User } from "@class/model/User.server.mts"
import { CashBundle } from "@class/CashBundle.mjs"
import Decimal from "decimal.js"

export type PercentageFormattedCuentas = {
    instance: Cuenta, 
    name: string, 
    percentage: number,
    currentTotal: number
}[]

export type ExtractionSummaryType = {
    satisfied: boolean // si ha conseguido sacar todo el dinero solicitado
    notSatisfiedCash: CashBundle // dinero que no se ha conseguido sacar
    extractedCash: CashBundle // dinero sacado
    ConsultedSubAccounts: { // dinero sacado de cada subcuenta
        subAccountCode: string
        extractedCash: CashBundle
    }[]
}

export class Cuenta extends Model {
    declare id: number
    declare name: string
    declare owner: number
    declare percentage: number
    declare isRemainder: boolean
    // si está en true, la cuenta no será mostrada ni usada por defecto
    declare ignore: boolean

    /**
     * Calcula el balance total de la cuenta sumando los montos de sus subcuentas.
     * @returns El balance total.
     */
    async getTotal(): Promise<number> {
        // recoger subcuentas
        const subcuentas = await Subcuenta.findAll({
            where: {
                cuenta: this.id
            }
        })

        // calcular todos los totales
        let total = new Decimal(0)
        for (const subcuenta of subcuentas) {
            total = total.add(subcuenta.total || 0)
        }

        return total.toNumber()
    }

    /**
     * Obtiene el total del metálico disponible en la cuenta
     */
    async getTotalAvailableCash(transaction?: Transaction): Promise<number> {
        const subcuentas = await Subcuenta.findAll({ 
            where: { cuenta: this.id },
            transaction: transaction
        })

        let sum = new Decimal(0)
        for (const sub of subcuentas) {
            sum = sum.add(sub.getTotalCash())
        }

        return sum.toNumber()
    }

    /**
     * Obtiene el metálico disponible total en la cuenta agregando todas las subcuentas.
     * 
     * @param transaction Transacción opcional
     * @returns El bundle con el metálico total disponible
     */
    async getAvailableCash(transaction?: Transaction): Promise<CashBundle> {
        let bundle = new CashBundle()
        const subcuentas = await Subcuenta.findAll({ 
            where: { cuenta: this.id },
            transaction: transaction
        })

        for (const sub of subcuentas) {
            let monto = await sub.getMonto(transaction)
            let subBundle = CashBundle.importFromValidAcceptedCashValues(monto)
            bundle.sumMonto(subBundle)
        }

        return bundle
    }

    /**
     * Extrae una cantidad de metálico de la cuenta sugerido buscando en cada una de las subcuentas.
     * 
     * Esta extracción lo hace usando una transacción de la base de datos obligatoriamente (porque hace uso de muchos cambios)
     * Una vez devuelto el resultado, el desarollador debe commitear o rollbackear los cambios (esta función no hace nada de eso).
     * 
     * @param requestedCash Bundle con la cantidad a extraer
     * @param transaction Transacción
     */
    async extractCash(requestedCash: CashBundle, transaction: Transaction): Promise<ExtractionSummaryType> {
        let extractionSummary: ExtractionSummaryType = {
            satisfied: false,
            notSatisfiedCash: requestedCash.cloneMonto(),
            extractedCash: new CashBundle(),
            ConsultedSubAccounts: []
        }
        let nonSatisfiedMoney = extractionSummary.notSatisfiedCash
        let totalExtracted = extractionSummary.extractedCash

        // si no hay dinero devolver el resumen vacío
        if (requestedCash.isEmpty()) {
            extractionSummary.satisfied = true
            return extractionSummary
        }

        // Pedir todas las subcuentas
        let subAccounts = await Subcuenta.findAll({ where: { cuenta: this.id }, transaction: transaction })
        for (const subCuenta of subAccounts) {
            // si está vacía la subcuenta saltamos a la siguiente
            if (subCuenta.getTotalCash() === 0) {
                continue
            }

            // solicitar extracción de la subcuenta
            let subExtracted = await subCuenta.extractCashArray(nonSatisfiedMoney.getNonEmptyCashArray(), transaction)

            if (subExtracted.length === 0) {
                continue // no se ha extraido nada
            }

            // crear nuevo bundle con el contenido
            let subExtractedBundle = new CashBundle()
            for (const [key, value] of subExtracted) {
                subExtractedBundle[key] += value
            }
            // subar al total
            totalExtracted.sumMonto(subExtractedBundle)
            // registrar en el resumen
            extractionSummary.ConsultedSubAccounts.push({
                subAccountCode: subCuenta.getSubcuentacode(),
                extractedCash: subExtractedBundle
            })
            // restarlo al restante
            nonSatisfiedMoney.subMonto(subExtractedBundle)
            
            // si se ha recogido ya todo entonces salir
            if(nonSatisfiedMoney.getTotal() === 0) {
                extractionSummary.satisfied = true
                break
            }
        }

        // devolver el resumen
        return extractionSummary
    }

    /**
     * Devuelve la primera subcuenta no llena de la cuenta o la crea
     */
    async getAvalibleSubcuenta(transaction?: Transaction): Promise<Subcuenta> {
        let subcuentaLibre = await Subcuenta.findOne({
            where: {
                cuenta: this.id,
                isFilled: false
            },
            transaction: transaction
        })

        // si no existe subcuenta libre entonces crearla
        if (!subcuentaLibre) {
            subcuentaLibre = await Subcuenta.create({}, { transaction: transaction })
            subcuentaLibre.cuenta = this.id
            subcuentaLibre.name = subcuentaLibre.getSubcuentacode()
            subcuentaLibre.save({ transaction: transaction })
        }

        return subcuentaLibre
    }

    /**
     * Deposita dinero en total pendiente en la cuenta
     * 
     * @throws {Error} si ocurre un error al depositar dinero en la subcuenta.
     */
    async depositMoney(amount: number, transaction?: Transaction): Promise<void> {
        let remaining = new Decimal(amount)

        // mientras exista remaining
        do {
            // obtener una subcuenta disponible
            let subcuenta = await this.getAvalibleSubcuenta(transaction)
            // obtener su máximo
            let maxAcceptedDeposit = subcuenta.getMaxAcceptedDeposit()
            // calcular el dinero que se puede instroducir
            let canPut = Math.min(remaining.toNumber(), maxAcceptedDeposit)
            // poner el put y restar a remaining
            if (!subcuenta.depositPendiente(canPut)) {
                throw new Error("Error al depositar dinero en la subcuenta.") // linea que no se debe ejecutar
            }
            remaining = remaining.sub(canPut)
            // guardar subcuenta
            subcuenta.save({ transaction: transaction })
        } while(remaining.toNumber() !== 0);
    }

    /**
     * Quita el isRemainder a todas las cuentas que pertenecen al mismo usuario.
     * @returns Una promesa que se resuelve cuando se han quitado los isRemainder.
     */
    static async removeAllIsRemainderForUser(userId: number): Promise<void> {
        await Cuenta.update(
            { 
                isRemainder: false 
            },
            {
                where: {
                    owner: userId,
                    isRemainder: true
                }
            }
        )
    }

    /**
     * Elimina el porcentaje excesivo de las cuentas aplicando un margen extra
     * para poder añadir otra cuenta, empieza eliminando el margen de las cuentas
     * con más porcentaje.
     * @returns Una promesa que se resuelve cuando se han quitado los isRemainder.
     */
    static async removeExcessMarginFromUser(userId: number, margin: number): Promise<void> {
        // obtener todas las cuentas
        const userAccounts = await Cuenta.findAll({
            where: {
                owner: userId,
                ignore: false
            },
            order: [['percentage', 'DESC']]
        })
        
        // contar el porcentaje de todas las cuentas
        let totalPercentage = 0
        for (const acc of userAccounts) {
            totalPercentage += acc.percentage
        }

        // si el porcentaje + el exceso supera 100 entonces restar el exceso a las cuentas
        if (totalPercentage + margin <= 100) {
            return
        }

        // eliminar el exceso de porcentaje
        let exceso = margin
        for (const acc of userAccounts) {
            // restar al exceso el porcentaje de la cuenta
            exceso -= acc.percentage
            acc.percentage = 0
            // si el exceso es negativo entonces devolver el exceso a la cuenta y salir
            if (exceso < 0) {
                acc.percentage -= exceso // el exceso es negativo por lo que hay que restarlo para que se sume
                await acc.save()
                return
            }
            // guardar la cuenta
            await acc.save()
        }
    }

    /**
     * Devuelve las cuentas dado su porcentaje, id y nombre para un usuario
     * La cuenta remainder la deja para el final con un porcentaje -1
     */
    static async getAllPercentageFormatted(user: User): Promise<PercentageFormattedCuentas> {
        const userAccounts = await Cuenta.findAll({
            where: {
                owner: user.id,
                ignore: false
            },
            order: [['percentage', 'DESC']]
        })

        // recoger todas las subcuentas
        let cleanAccounts: PercentageFormattedCuentas = []
        let remainderAccount: false|Cuenta = false
        for (let account of userAccounts) {
            if (account.isRemainder) {
                // si es restante entonces guardarla para el final
                remainderAccount = account
            } else {
                // guardar cuenta en la lista
                cleanAccounts.push({
                    instance: account,
                    name: account.name,
                    percentage: account.percentage,
                    currentTotal: await account.getTotal()
                })
            }
        }

        // si existe cuenta con remainder entonces añadirla al final con -1 y devolverla
        if (remainderAccount) {
            remainderAccount = remainderAccount as Cuenta
            cleanAccounts.unshift({
                instance: remainderAccount,
                name: remainderAccount.name,
                percentage: -1,
                currentTotal: await remainderAccount.getTotal()
            })
        }

        return cleanAccounts
    }
}