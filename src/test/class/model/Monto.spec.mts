import { DatabaseController } from "@single/DatabaseController.server.mjs"
import { Monto } from "@class/model/Monto.server.mjs"
import { CashBundle } from "@class/CashBundle.mjs"

beforeAll(async () => {
    await DatabaseController.sync()
})

/**
 * Tests para comprobar que las operaciones cruciales funcionan correctamente.
 * 
 * Se ha podido detectar fallos en el algoritmo de transferencia de billetes gracias a estos tests.
 */
describe("Monto Class - Cash Movement Tests", () => {
    
    it("should move cash correctly from one Monto to another", async () => {
        let montoA = await Monto.create()
        let montoB = await Monto.create()
        
        montoA.clearCash()
        montoB.clearCash()

        // Monto A: 1x50, 1x20
        montoA.cincuenta = 1
        montoA.veinte = 1
        await montoA.save()

        // Monto B: 1x10, 1x20
        montoB.veinte = 1
        montoB.diez = 1
        await montoB.save()

        // Mover A a B
        montoA.moveCashTo(montoB)
        await montoA.save()
        await montoB.save()

        // Verificar que A está vacío
        expect(montoA.cincuenta).toBe(0)
        expect(montoA.veinte).toBe(0)
        expect(montoA.diez).toBe(0)

        // Verificar que B ha acumulado todo: 1x50, 2x20, 1x10
        expect(montoB.cincuenta).toBe(1)
        expect(montoB.veinte).toBe(2)
        expect(montoB.diez).toBe(1)

        await montoA.destroy()
        await montoB.destroy()
    })

    it("should extract money to a CashBundle and clear the Monto", async () => {
        // monto con inicialmente 2x50
        let monto = await Monto.create()
        monto.clearCash()
        monto.cincuenta = 2
        await monto.save()

        let bundle = monto.extractMoneyToCashBundle()
        await monto.save()

        // Verificar que se crea correctamente el bundle
        expect(bundle).toBeInstanceOf(CashBundle)
        expect(bundle.cincuenta).toBe(2)
        expect(bundle.getTotal()).toBe(100)

        // Verificar que el Monto sigue intacto
        expect(monto.cincuenta).toBe(0)
        expect(CashBundle.importFromValidAcceptedCashValues(monto).getTotal()).toBe(0)

        await monto.destroy()
    })

    it("should insert cash array greedily (Standard Behavior)", async () => {
        let monto = await Monto.create()
        monto.clearCash()

        // Escenario: Tenemos 1x50, 3x20. Se necesita 70.
        // Array: [[50, 50, 1], [20, 20, 3]]
        let bundle = new CashBundle()
        bundle.cincuenta = 1
        bundle.veinte = 3
        let cashArray = bundle.getNonEmptyCashArray()

        let inserted = monto.insertCashArray(cashArray, 70)

        // Pasos esperados:
        // 1. Coger 50
        // 2. Coger 20
        
        expect(inserted).toBe(70)
        expect(monto.cincuenta).toBe(1)
        expect(monto.veinte).toBe(1)

        // Verificar que CashArray se modificó correctamente
        // Debe contener 0x50 y 2x20
        expect(cashArray[0]![2]).toBe(0)
        expect(cashArray[1]![2]).toBe(2)

        await monto.destroy()
    })

    it("should demonstrate greedy trap in insertCashArray", async () => {
        let monto = await Monto.create()
        monto.clearCash()

        // Tenemos 1x50, 3x20.
        let bundle = new CashBundle()
        bundle.cincuenta = 1
        bundle.veinte = 3
        let cashArray = bundle.getNonEmptyCashArray()

        // Se necesita 60.
        let inserted = monto.insertCashArray(cashArray, 60)
        
        // como solo hay 1x50 y 3x20 entonces debe introducir solo 1x50
        expect(inserted).toBe(50) // No 60!
        expect(monto.cincuenta).toBe(1)
        expect(monto.veinte).toBe(0)

        // el array debe mantenerse con 0x50 y 3x20
        expect(cashArray[0]![2]).toBe(0)
        expect(cashArray[1]![2]).toBe(3)

        await monto.destroy()
    })
})

describe("Monto Multi-phase Lifecycle Test", () => {

    /**
     * Se inserta en diferentes montos el dinero de una caja (simulación)
     */
    it("should handle a full cycle of distribution and consolidation", async () => {
        // inicializar montos
        let safe = await Monto.create() // restante
        let registerA = await Monto.create()
        let registerB = await Monto.create()
        let registerC = await Monto.create()

        safe.clearCash()
        registerA.clearCash()
        registerB.clearCash()
        registerC.clearCash()

        // El restante comienza con: 2x50 (100), 3x20 (60), 1x10 (10). Total: 170.
        safe.cincuenta = 2
        safe.veinte = 3
        safe.diez = 1
        await safe.save()
        // probar que está correcto
        expect(safe.getCurrentTotal()).toBe(170)

        // extraer el dinero del restante para repartirlo
        let safeCashArray = safe.exportNonEmptyCashArray()
        safe.clearCash()
        expect(safe.getCurrentTotal()).toBe(0)

        // rellenar A con 70: 1x50 y 1x20
        let insertedA = registerA.insertCashArray(safeCashArray, 70)
        await registerA.save()

        // comprobar que se ha insertado 70: 1x50, 1x20
        expect(registerA.getCurrentTotal()).toBe(70)
        expect(insertedA).toBe(70)
        expect(registerA.cincuenta).toBe(1)
        expect(registerA.veinte).toBe(1)
        expect(registerA.diez).toBe(0)

        // comprobar que queda 1x50, 2x20, 1x10 en el restante
        expect(safeCashArray[0]![2]).toBe(1)
        expect(safeCashArray[1]![2]).toBe(2)
        expect(safeCashArray[2]![2]).toBe(1)

        // limpiar billetes usados (0 billetes restantes) (no necesario pero se hace para simular el algoritmo existente)
        safeCashArray = safeCashArray.filter(r => r[2] !== 0)
        expect(safeCashArray.length).toBe(3)

        // insertar 30, actualmente hay: 1x50, 2x20, 1x10
        let insertedB = registerB.insertCashArray(safeCashArray, 30)
        await registerB.save()
        // comprobar que se ha insertado 30: 1x20, 1x10
        expect(registerB.getCurrentTotal()).toBe(30)
        expect(insertedB).toBe(30)
        expect(registerB.cincuenta).toBe(0)
        expect(registerB.veinte).toBe(1)
        expect(registerB.diez).toBe(1)

        // comprobar que queda 1x50, 1x20, 0x10 en el restante
        expect(safeCashArray[0]![2]).toBe(1)
        expect(safeCashArray[1]![2]).toBe(1)
        expect(safeCashArray[2]![2]).toBe(0)

        // limpiar billetes usados (0 billetes restantes)
        safeCashArray = safeCashArray.filter(r => r[2] !== 0)
        expect(safeCashArray.length).toBe(2)
        expect(safeCashArray[0]![2]).toBe(1)
        expect(safeCashArray[1]![2]).toBe(1)

        // insertar 40, actualmente hay: 1x50, 1x20
        let insertedC = registerC.insertCashArray(safeCashArray, 40)
        await registerC.save()
        // comprobar que se ha insertado 20: 1x20
        expect(registerC.getCurrentTotal()).toBe(20)
        expect(insertedC).toBe(20)
        expect(registerC.cincuenta).toBe(0)
        expect(registerC.veinte).toBe(1)
        expect(registerC.diez).toBe(0)

        // comprobar que queda 1x50, 0x20 en el restante
        expect(safeCashArray[0]![2]).toBe(1)
        expect(safeCashArray[1]![2]).toBe(0)

        // limpiar billetes usados (0 billetes restantes)
        safeCashArray = safeCashArray.filter(r => r[2] !== 0)
        expect(safeCashArray.length).toBe(1)
        expect(safeCashArray[0]![2]).toBe(1)


        // guardar el resto en el restante
        for (let [cashKey, cashValue, cashCuantity] of safeCashArray) {
            safe[cashKey] = cashCuantity
        }
        await safe.save()
        expect(safe.getCurrentTotal()).toBe(50)

        // Solo debe quedar 1x50
        expect(safe.cincuenta).toBe(1)
        expect(safe.veinte).toBe(0)
        expect(safe.diez).toBe(0)

        // mover todo de los montos a la caja
        // Movidos 70: 1x50, 1x20
        registerA.moveCashTo(safe)
        expect(safe.cincuenta).toBe(2)
        expect(safe.veinte).toBe(1)
        expect(safe.diez).toBe(0)
        expect(safe.getCurrentTotal()).toBe(120)

        // Movidos 30: 1x20, 1x10
        registerB.moveCashTo(safe)
        expect(safe.cincuenta).toBe(2)
        expect(safe.veinte).toBe(2)
        expect(safe.diez).toBe(1)
        expect(safe.getCurrentTotal()).toBe(150)

        // Movidos 20: 1x20
        registerC.moveCashTo(safe)
        expect(safe.cincuenta).toBe(2)
        expect(safe.veinte).toBe(3)
        expect(safe.diez).toBe(1)
        expect(safe.getCurrentTotal()).toBe(170)

        // guardar todo
        await safe.save()
        await registerA.save()
        await registerB.save()
        await registerC.save()

        // Verificar que están vacíos
        expect(registerA.getCurrentTotal()).toBe(0)
        expect(registerB.getCurrentTotal()).toBe(0)
        expect(registerC.getCurrentTotal()).toBe(0)
        expect(safe.getCurrentTotal()).toBe(170)

        // eliminar todo
        await safe.destroy()
        await registerA.destroy()
        await registerB.destroy()
        await registerC.destroy()
    })
})
