/***
 * TODO: TESTS GENERADOS POR IA, REVISARLOS EN PROFUNDIDAD Y MODIFICARLOS
 */
import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { User } from "@class/model/User.server.mjs"
import { DatabaseController } from "@single/DatabaseController.server.mjs"
import bcrypt from "bcrypt"
import { CashBundle } from "@class/CashBundle.mjs"
import { aplyIngresarOperation, calculateExpenseImpact } from "@routes/private/ingresarMonto/index.server.mjs"
import { Expense } from "@class/model/Expense.server.mjs"
import { TipoGasto } from "@data/enums/ExpenseType.mjs"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"

let testUserId = -1
let user: User

beforeAll(async () => {
    await DatabaseController.sync()
    user = new User()
    user.username = "testUserIngresarMonto"
    user.password = bcrypt.hashSync("1234", 10)
    await user.save()

    testUserId = user.id

    // Crear cuentas
    let cuentasTest = [
        { name: "Principal", percentage: 50 },
        { name: "Ahorro", percentage: 30 },
        { name: "Gastos", percentage: 20 } // Esta será la remainder implícitamente si se configura así o la última
    ]

    for (let c of cuentasTest) {
        let newCuenta = await Cuenta.create()
        newCuenta.name = c.name
        newCuenta.owner = testUserId
        newCuenta.percentage = c.percentage
        if (c.name === "Gastos") newCuenta.isRemainder = true // Marcar una como remainder
        await newCuenta.save()
    }

    // Crear un gasto fijo mensual
    let expense = await Expense.create()
    expense.name = "Netflix"
    expense.amount = 15 // 15 euros
    expense.owner = testUserId
    expense.type = TipoGasto.MENSUAL
    await expense.save()
})

describe("Ingresar Monto Tests", () => {
    
    it("calculateExpenseImpact should distribute money correctly taking expenses into account", async () => {
        // Preparar un bundle de dinero: 100 euros (2 billetes de 50)
        let cashBundle = new CashBundle()
        cashBundle.cincuenta = 2

        // Calcular impacto
        // Total ingresado: 100
        // Gastos: 15
        // Restante para repartir: 85
        // Principal (50%): 42.50
        // Ahorro (30%): 25.50
        // Gastos (20% - remainder): 85 - 42.50 - 25.50 = 17.00

        let result = await calculateExpenseImpact(user, cashBundle)

        if (typeof result === 'string') {
            fail(result)
            return
        }

        expect(result.totalExpenses).toBe(15)
        
        let principal = result.cuentas.find(c => c.name === "Principal")
        let ahorro = result.cuentas.find(c => c.name === "Ahorro")
        let gastos = result.cuentas.find(c => c.name === "Gastos")

        expect(principal).toBeDefined()
        expect(ahorro).toBeDefined()
        expect(gastos).toBeDefined()

        expect(principal!.moneyToSum).toBe(42.50)
        expect(ahorro!.moneyToSum).toBe(25.50)
        expect(gastos!.moneyToSum).toBe(17.00)
    })

    it("aplyIngresarOperation should apply the transaction and update balances", async () => {
        // Preparar un bundle de dinero: 100 euros
        let cashBundle = new CashBundle()
        cashBundle.cincuenta = 2

        // Primero calculamos la estimación
        let estimation = await calculateExpenseImpact(user, cashBundle)
        
        if (typeof estimation === 'string') {
            fail(estimation)
            return
        }

        // Iniciar transacción DB
        let transaction = await DatabaseController.startTransaction()
        let summary
        
        try {
            summary = await aplyIngresarOperation(user, estimation, cashBundle, transaction)
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            fail("Transaction failed: " + e)
            return
        }

        expect(summary).toBeDefined()
        expect(summary.transactionUuid).toBeDefined()

        // Verificar saldos en DB
        let cuentas = await Cuenta.findAll({ where: { owner: testUserId } })
        
        let principal = cuentas.find(c => c.name === "Principal")
        let ahorro = cuentas.find(c => c.name === "Ahorro")
        let gastos = cuentas.find(c => c.name === "Gastos")

        // Verificar que los saldos se han actualizado
        
        // Principal: 42.50
        expect(await principal!.getTotal()).toBeCloseTo(42.50, 2)
        // Ahorro: 25.50
        expect(await ahorro!.getTotal()).toBeCloseTo(25.50, 2)
        // Gastos: 17.00
        expect(await gastos!.getTotal()).toBeCloseTo(17.00, 2)
        
        // Verificar que la cuenta de gastos del sistema (ExpensesAccount) recibió los 15 euros
        // getExpensesAccount crea una si no existe
        let expenseAccount = await user.getExpensesAccount()
        expect(await expenseAccount.getTotal()).toBe(15.00)
    })

    it("should fail if expenses exceed the input amount", async () => {
        // Preparar un bundle de dinero insuficiente: 10 euros
        let cashBundle = new CashBundle()
        cashBundle.diez = 1

        // Calcular impacto (Gastos son 15)
        let result = await calculateExpenseImpact(user, cashBundle)

        expect(typeof result).toBe('string')
        expect(result).toContain("Los gastos superan el importe introducido")
    })

    it("should fail if there are no accounts", async () => {
        // Crear usuario sin cuentas
        let otherUser = new User()
        otherUser.username = "noAccountsUser"
        otherUser.password = "1234"
        await otherUser.save()

        let cashBundle = new CashBundle()
        cashBundle.cincuenta = 1

        let result = await calculateExpenseImpact(otherUser, cashBundle)

        expect(typeof result).toBe('string')
        expect(result).toBe("No existen cuentas creadas.")
        
        await otherUser.destroy()
    })
})

describe("Ingresar Monto Complex Flow (Cash Redistribution)", () => {
    let complexUser: User
    let accountA: Cuenta
    let accountB: Cuenta

    beforeAll(async () => {
        complexUser = new User()
        complexUser.username = "complexUser"
        complexUser.password = "1234"
        await complexUser.save()

        // Crear 2 cuentas al 50%
        accountA = await Cuenta.create({ name: "AccountA", owner: complexUser.id, percentage: 50, isRemainder: false })
        accountB = await Cuenta.create({ name: "AccountB", owner: complexUser.id, percentage: 50, isRemainder: true })
        // Sin gastos para simplificar
    })

    it("should keep unsplittable cash in user pending amount", async () => {
        // Ingresar 50 euros (1 billete de 50)
        // Account A: 25 euros
        // Account B: 25 euros
        // Billete de 50: No se puede dividir. Debería quedarse en pendingMonto del usuario.
        
        let cashBundle = new CashBundle()
        cashBundle.cincuenta = 1

        let estimation = await calculateExpenseImpact(complexUser, cashBundle)
        
        // Mock expenses for this test to be 0
        if (typeof estimation === 'string') { fail(estimation); return }

        let transaction = await DatabaseController.startTransaction()
        try {
            await aplyIngresarOperation(complexUser, estimation, cashBundle, transaction)
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            fail(e)
            return
        }

        // Verificar saldos numéricos
        expect(await accountA.getTotal()).toBe(25)
        expect(await accountB.getTotal()).toBe(25)

        // Verificar ubicación del billete físico
        let pendingMonto = await complexUser.getPendingCash()
        await pendingMonto.reload() // Recargar para asegurar datos frescos
        
        // El billete de 50 debe estar en pendingMonto
        expect(pendingMonto.cincuenta).toBe(1)

        // Los montos de las subcuentas deberían estar vacíos (físicamente)
        let subA = await accountA.getAvalibleSubcuenta()
        let montoA = await subA.getMonto()
        expect(montoA.cincuenta).toBe(0)
        expect(CashBundle.importFromValidAcceptedCashValues(montoA).getTotal()).toBe(0) // 0 valor físico
    })

    it("should redistribute cash when suitable denominations are added", async () => {
        // Estado anterior:
        // Account A: 25€ (pending assignment)
        // Account B: 25€ (pending assignment)
        // User Pending Cash: 50€ (1x50)

        // Nuevo Ingreso: 50€ (5 billetes de 10)
        // Nuevo Estado Total:
        // Account A: 50€
        // Account B: 50€
        // Cash total: 1x50, 5x10.
        
        // Distribución esperada (el algoritmo intentará llenar las cuentas):
        // Account A necesita 50€. Puede tomar el billete de 50€ si está disponible primero, o 5x10€.
        // El algoritmo reallocateCashToSubaccounts inserta desde el billete más grande.
        // Account A (o B, dependiendo del orden) debería llevarse el de 50. La otra los 5 de 10.
        
        let cashBundle = new CashBundle()
        cashBundle.diez = 5

        let estimation = await calculateExpenseImpact(complexUser, cashBundle)
        if (typeof estimation === 'string') { fail(estimation); return }

        let transaction = await DatabaseController.startTransaction()
        try {
            await aplyIngresarOperation(complexUser, estimation, cashBundle, transaction)
            await transaction.commit()
        } catch (e) {
            await transaction.rollback()
            fail(e)
            return
        }

        // Verificar saldos numéricos (acumulados)
        expect(await accountA.getTotal()).toBe(50)
        expect(await accountB.getTotal()).toBe(50)

        // Verificar ubicación del billete físico
        let pendingMonto = await complexUser.getPendingCash()
        await pendingMonto.reload()
        
        // Todo el dinero debería haberse repartido
        expect(CashBundle.importFromValidAcceptedCashValues(pendingMonto).getTotal()).toBe(0)

        // Verificar que las subcuentas tienen el dinero físico
        let subA = await accountA.getAvalibleSubcuenta()
        let montoA = await subA.getMonto()
        
        let subB = await accountB.getAvalibleSubcuenta()
        let montoB = await subB.getMonto()

        let totalFisicoA = CashBundle.importFromValidAcceptedCashValues(montoA).getTotal()
        let totalFisicoB = CashBundle.importFromValidAcceptedCashValues(montoB).getTotal()

        expect(totalFisicoA).toBe(50)
        expect(totalFisicoB).toBe(50)

        // Verificar composición específica (uno debe tener 1x50 y el otro 5x10)
        let tieneCincuenta = (montoA.cincuenta === 1) || (montoB.cincuenta === 1)
        let tieneDieces = (montoA.diez === 5) || (montoB.diez === 5)

        expect(tieneCincuenta).toBeTrue()
        expect(tieneDieces).toBeTrue()
    })

    it("should maintain total system cash integrity after complex transactions", async () => {
        // --- Setup Phase ---
        // Clean state
        await Cuenta.destroy({ where: { owner: complexUser.id } })
        let acc1 = await Cuenta.create({ name: "Acc1", owner: complexUser.id, percentage: 33, isRemainder: false })
        let acc2 = await Cuenta.create({ name: "Acc2", owner: complexUser.id, percentage: 33, isRemainder: false })
        let acc3 = await Cuenta.create({ name: "Acc3", owner: complexUser.id, percentage: 34, isRemainder: true })
        // (Sum = 100%)

        let initialPending = await complexUser.getPendingCash()
        await initialPending.reload()
        expect(CashBundle.importFromValidAcceptedCashValues(initialPending).getTotal()).toBe(0)

        // --- Operation Phase ---
        // 1. Add 100 (1x100 - no, 2x50)
        let cash1 = new CashBundle()
        cash1.cincuenta = 2 // 100
        let est1 = await calculateExpenseImpact(complexUser, cash1) as any
        let tx1 = await DatabaseController.startTransaction()
        await aplyIngresarOperation(complexUser, est1, cash1, tx1)
        await tx1.commit()

        // 2. Add 50 (5x10)
        let cash2 = new CashBundle()
        cash2.diez = 5 // 50
        let est2 = await calculateExpenseImpact(complexUser, cash2) as any
        let tx2 = await DatabaseController.startTransaction()
        await aplyIngresarOperation(complexUser, est2, cash2, tx2)
        await tx2.commit()

        // 3. Add weird amount: 20.05 (1x20, 1x0.05)
        let cash3 = new CashBundle()
        cash3.veinte = 1
        cash3.cerocinco = 1
        let est3 = await calculateExpenseImpact(complexUser, cash3) as any
        let tx3 = await DatabaseController.startTransaction()
        await aplyIngresarOperation(complexUser, est3, cash3, tx3)
        await tx3.commit()

        // Total Input: 100 + 50 + 20.05 = 170.05

        // --- Verification Phase ---
        // Sum all physical cash in all accounts + user pending
        
        let totalSystemCash = 0

        // Get all subaccounts for user
        let accounts = await Cuenta.findAll({ where: { owner: complexUser.id } })
        for (let acc of accounts) {
            let sub = await acc.getAvalibleSubcuenta()
            let monto = await sub.getMonto()
            totalSystemCash += CashBundle.importFromValidAcceptedCashValues(monto).getTotal()
        }

        // Get user pending
        let pending = await complexUser.getPendingCash()
        await pending.reload()
        totalSystemCash += CashBundle.importFromValidAcceptedCashValues(pending).getTotal()

        // Check if sums match (with float precision tolerance)
        expect(totalSystemCash).toBeCloseTo(170.05, 2)
    })
    
    afterAll(async () => {
        await Cuenta.destroy({ where: { owner: complexUser.id } })
        await User.destroy({ where: { id: complexUser.id } })
    })
})

afterAll(async () => {
    // Limpieza
    await Cuenta.destroy({ where: { owner: testUserId } })
    await Expense.destroy({ where: { owner: testUserId } })
    await User.destroy({ where: { id: testUserId } })
})
