import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { User } from "@class/model/User.server.mjs"
import { DatabaseController } from "@single/DatabaseController.server.mjs"
import { CashBundle } from "@class/CashBundle.mjs"
import bcrypt from "bcrypt"

let testUser: User
let testCuenta: Cuenta

beforeAll(async () => {
    await DatabaseController.sync()
})

beforeEach(async () => {
    // Crear usuario de prueba
    testUser = await User.create({
        username: "testUserSub_" + Date.now(),
        password: bcrypt.hashSync("1234", 10)
    })

    // Crear cuenta de prueba usando función de usuario (getExpensesAccount crea una si no existe)
    testCuenta = await testUser.getExpensesAccount()
})

afterEach(async () => {
    if (testUser) {
        // Limpiar cuentas y subcuentas asociadas al usuario
        const accounts = await Cuenta.findAll({ where: { owner: testUser.id } })
        for (const acc of accounts) {
            await Subcuenta.destroy({ where: { cuenta: acc.id } })
            await acc.destroy()
        }
        await testUser.destroy()
    }
})

/**
 * Tests para comprobar que las funcionalidades cruciales de la subcuenta funcionan correctamente
 */
describe("Subcuenta.extractCashArray", () => {
    
    it("should handle an empty requestArray when the subaccount has money", async () => {
        // Usar función de cuenta para crear subcuenta
        let sub = await testCuenta.getAvalibleSubcuenta()
        
        // Configuración manual para condiciones de prueba
        sub.total = 100
        sub.maxMoney = 1000
        sub.isFilled = false
        sub.cashPending = 0
        await sub.save()
        
        // Configurar monto con dinero
        let monto = await sub.getMonto()
        monto.cincuenta = 2
        await monto.save()

        const t = await DatabaseController.startTransaction()
        
        // Petición vacía usando CashBundle
        const bundle = new CashBundle()
        const requestedArray = bundle.getNonEmptyCashArray()
        
        const result = await sub.extractCashArray(requestedArray, t)
        
        await t.commit()
        await sub.reload()

        // Comprobaciones
        expect(sub.total).toBe(100) // Sin cambios
        expect(sub.isFilled).toBeFalse()
        expect(sub.cashPending).toBe(0)
        
        expect(result).toBeDefined()
        const resultMap = new Map(result)
        expect(resultMap.size).toBe(0)
    })

    it("should update isFilled to false and reduce total when extracting money from a filled subaccount with pending cash", async () => {
        // Usar función de cuenta para crear subcuenta
        let sub = await testCuenta.getAvalibleSubcuenta()

        // Configuración: Subcuenta llena (total = maxMoney), tiene dinero pendiente
        sub.total = 1000
        sub.maxMoney = 1000
        sub.isFilled = true
        sub.cashPending = 500
        await sub.save()

        let monto = await sub.getMonto()
        monto.cincuenta = 10 // 500 en efectivo
        await monto.save()

        const t = await DatabaseController.startTransaction()

        // Solicitar 100 (2 x 50) usando CashBundle
        const bundle = new CashBundle()
        bundle.cincuenta = 2
        const requestedArray = bundle.getNonEmptyCashArray()
        
        const result = await sub.extractCashArray(requestedArray, t)
        
        await t.commit()
        await sub.reload()

        // Comprobaciones
        expect(sub.total).toBe(900) // 1000 - 100
        expect(sub.cashPending).toBe(500) 
        
        expect(sub.isFilled).toBeFalse() // Debería volverse falso
        
        // Comprobación usando Map
        expect(result).toBeDefined()
        const resultMap = new Map(result)
        expect(resultMap.size).toBe(1)
        expect(resultMap.get("cincuenta")).toBe(2)
    })

    it("should reduce the total correctly in a non-filled subaccount", async () => {
        // Usar función de cuenta para crear subcuenta
        let sub = await testCuenta.getAvalibleSubcuenta()

        sub.total = 200
        sub.maxMoney = 1000
        sub.isFilled = false
        sub.cashPending = 0
        await sub.save()

        let monto = await sub.getMonto()
        monto.veinte = 10 // 200
        await monto.save()

        const t = await DatabaseController.startTransaction()

        // Solicitar 60 (3 x 20) usando CashBundle
        const bundle = new CashBundle()
        bundle.veinte = 3
        const requestedArray = bundle.getNonEmptyCashArray()
        
        const result = await sub.extractCashArray(requestedArray, t)
        
        await t.commit()
        await sub.reload()

        expect(sub.total).toBe(140) // 200 - 60
        expect(sub.isFilled).toBeFalse()
        expect(sub.cashPending).toBe(0)
        
        expect(result).toBeDefined()
        const resultMap = new Map(result)
        expect(resultMap.size).toBe(1)
        expect(resultMap.get("veinte")).toBe(3)
    })

    it("should extract only what is available if more is requested than available (limit by bill availability)", async () => {
        // Usar función de cuenta para crear subcuenta
        let sub = await testCuenta.getAvalibleSubcuenta()

        sub.total = 50
        sub.maxMoney = 1000
        sub.isFilled = false
        sub.cashPending = 0
        await sub.save()

        let monto = await sub.getMonto()
        monto.cincuenta = 1 // 50
        await monto.save()

        const t = await DatabaseController.startTransaction()

        // Solicitar 20 usando CashBundle (tenemos 50 pero en billete de 50)
        const bundle = new CashBundle()
        bundle.veinte = 1
        const requestedArray = bundle.getNonEmptyCashArray()
        
        const result = await sub.extractCashArray(requestedArray, t)
        
        await t.commit()
        await sub.reload()

        expect(sub.total).toBe(50) // Nada extraído
        expect(sub.cashPending).toBe(0)
        expect(sub.isFilled).toBeFalse()
        
        expect(result).toBeDefined()
        const resultMap = new Map(result)
        expect(resultMap.size).toBe(0)
    })

    it("should extract partially if some bills are available but not all requested", async () => {
        // Usar función de cuenta para crear subcuenta
        let sub = await testCuenta.getAvalibleSubcuenta()

        sub.total = 100
        sub.maxMoney = 1000
        sub.isFilled = false
        sub.cashPending = 0
        await sub.save()

        let monto = await sub.getMonto()
        monto.veinte = 2 // 40 disponible
        monto.diez = 0
        await monto.save()

        const t = await DatabaseController.startTransaction()

        // Solicitar 3 x 20 (60 total) usando CashBundle
        const bundle = new CashBundle()
        bundle.veinte = 3
        const requestedArray = bundle.getNonEmptyCashArray()
        
        const result = await sub.extractCashArray(requestedArray, t)
        
        await t.commit()
        await sub.reload()

        // Disponible era 2x20. Solicitado 3x20.
        // Debería extraer 2x20 = 40.
        // Total debería ser 100 - 40 = 60.
        
        expect(sub.total).toBe(60) // 100 - 40
        expect(sub.cashPending).toBe(0)
        expect(sub.isFilled).toBeFalse()
        
        expect(result).toBeDefined()
        const resultMap = new Map(result)
        expect(resultMap.size).toBe(1)
        expect(resultMap.get("veinte")).toBe(2)
    })

    it("should return empty result and not change total when subaccount has only pending money (no physical cash)", async () => {
        // Usar función de cuenta para crear subcuenta
        let sub = await testCuenta.getAvalibleSubcuenta()

        // Configuración: Solo dinero pendiente
        sub.total = 0
        sub.maxMoney = 1000
        sub.isFilled = false
        sub.cashPending = 500
        await sub.save()

        let monto = await sub.getMonto()
        monto.clearCash() // Asegurar que está vacío
        await monto.save()

        const t = await DatabaseController.startTransaction()

        // Solicitar 50 usando CashBundle
        const bundle = new CashBundle()
        bundle.cincuenta = 1
        const requestedArray = bundle.getNonEmptyCashArray()
        
        const result = await sub.extractCashArray(requestedArray, t)
        
        await t.commit()
        await sub.reload()

        // Comprobaciones
        expect(sub.total).toBe(0) // No debe cambiar
        expect(sub.cashPending).toBe(500) // No debe cambiar
        expect(sub.isFilled).toBeFalse()
        
        expect(result).toBeDefined()
        const resultMap = new Map(result)
        expect(resultMap.size).toBe(0) // No se extrajo nada físico
    })
})