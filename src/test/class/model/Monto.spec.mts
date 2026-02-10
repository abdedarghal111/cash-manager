/***
 * TODO: TESTS GENERADOS POR IA, REVISARLOS EN PROFUNDIDAD Y MODIFICARLOS
 */
import { DatabaseController } from "@single/DatabaseController.server.mjs"
import { Monto } from "@class/model/Monto.server.mjs"
import { CashBundle } from "@class/CashBundle.mjs"
import { AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"

beforeAll(async () => {
    await DatabaseController.sync()
})

describe("Monto Class - Cash Movement Tests", () => {
    
    it("should move cash correctly from one Monto to another", async () => {
        let montoA = await Monto.create({})
        let montoB = await Monto.create({})
        
        montoA.clearCash()
        montoB.clearCash()

        // Setup Monto A: 1x50, 1x20
        montoA.cincuenta = 1
        montoA.veinte = 1
        await montoA.save()

        // Setup Monto B: 1x10
        montoB.diez = 1
        await montoB.save()

        // Move A to B
        montoA.moveCashTo(montoB)
        await montoA.save()
        await montoB.save()

        // Verify A is empty
        expect(montoA.cincuenta).toBe(0)
        expect(montoA.veinte).toBe(0)
        expect(montoA.diez).toBe(0)

        // Verify B has accumulated cash
        expect(montoB.cincuenta).toBe(1)
        expect(montoB.veinte).toBe(1)
        expect(montoB.diez).toBe(1) // Existing 10 + moved cash
    })

    it("should extract money to a CashBundle and clear the Monto", async () => {
        let monto = await Monto.create({})
        monto.clearCash()
        monto.cincuenta = 2
        await monto.save()

        let bundle = monto.extractMoneyToCashBundle()
        await monto.save()

        // Verify Bundle
        expect(bundle).toBeInstanceOf(CashBundle)
        expect(bundle.cincuenta).toBe(2)
        expect(bundle.getTotal()).toBe(100)

        // Verify Monto is cleared
        expect(monto.cincuenta).toBe(0)
        expect(CashBundle.importFromValidAcceptedCashValues(monto).getTotal()).toBe(0)
    })

    it("should insert cash array greedily (Standard Behavior)", async () => {
        let monto = await Monto.create({})
        monto.clearCash()

        // Scenario: Have 1x50, 3x20. Need 70.
        // Array: [[50, 50, 1], [20, 20, 3]]
        // Note: CashBundle.getNonEmptyCashArray() order depends on implementation but usually high to low
        let bundle = new CashBundle()
        bundle.cincuenta = 1
        bundle.veinte = 3
        let cashArray = bundle.getNonEmptyCashArray()

        let inserted = monto.insertCashArray(cashArray, 70)

        // Expectation:
        // 1. Takes 50 (Need 20 more)
        // 2. Takes 20 (Need 0 more)
        
        expect(inserted).toBe(70)
        expect(monto.cincuenta).toBe(1)
        expect(monto.veinte).toBe(1)

        // Verify CashArray was modified in place
        // 50s should be 0
        expect(cashArray[0]![2]).toBe(0)
        // 20s should be 2 (3 - 1)
        expect(cashArray[1]![2]).toBe(2)
    })

    it("should demonstrate greedy trap in insertCashArray", async () => {
        let monto = await Monto.create({})
        monto.clearCash()

        // Scenario: Have 1x50, 3x20. Need 60.
        // Greedy algo: Takes 50. Needs 10. 20 doesn't fit into 10. Stops.
        // Result: Inserted 50. Failed to reach 60 despite having 3x20 (which sums to 60).
        
        let bundle = new CashBundle()
        bundle.cincuenta = 1
        bundle.veinte = 3
        let cashArray = bundle.getNonEmptyCashArray()

        let inserted = monto.insertCashArray(cashArray, 60)

        expect(inserted).toBe(50) // Not 60!
        expect(monto.cincuenta).toBe(1)
        expect(monto.veinte).toBe(0)
    })
})

describe("Monto Multi-phase Lifecycle Test", () => {
    // This test simulates a full cycle of cash moving between a "Safe" and "Registers"
    
    let safe: Monto
    let registerA: Monto
    let registerB: Monto

    beforeAll(async () => {
        safe = await Monto.create({})
        registerA = await Monto.create({})
        registerB = await Monto.create({})
    })

    beforeEach(async () => {
        safe.clearCash()
        registerA.clearCash()
        registerB.clearCash()
    })

    it("should handle a full cycle of distribution and consolidation", async () => {
        // --- PHASE 1: Initialization ---
        // Safe starts with: 2x50 (100), 3x20 (60), 1x10 (10). Total: 170.
        safe.cincuenta = 2
        safe.veinte = 3
        safe.diez = 1
        await safe.save()

        // --- PHASE 2: Distribution to Register A ---
        // Register A needs 70.
        // Extract available cash from Safe to an array for distribution logic
        
        let safeCashArray = safe.exportNonEmptyCashArray()
        
        // Clear safe (logic in reallocateCashToSubaccounts usually clears it then refills with remainder)
        safe.clearCash() 

        // Fill A
        let insertedA = registerA.insertCashArray(safeCashArray, 70)
        await registerA.save()

        expect(insertedA).toBe(70)
        expect(registerA.cincuenta).toBe(1)
        expect(registerA.veinte).toBe(1)
        expect(registerA.diez).toBe(0)

        // --- PHASE 3: Distribution to Register B ---
        // Register B needs 30.
        // Remaining in safeCashArray: 1x50, 2x20, 1x10.
        
        // Filter out empty rows from previous step
        safeCashArray = safeCashArray.filter(r => r[2] > 0)

        let insertedB = registerB.insertCashArray(safeCashArray, 30)
        await registerB.save()

        expect(insertedB).toBe(30)
        expect(registerB.cincuenta).toBe(0)
        expect(registerB.veinte).toBe(1) // Takes 1x20
        expect(registerB.diez).toBe(1)   // Takes 1x10

        // --- PHASE 4: Return Remainders to Safe ---
        // Remaining in safeCashArray: 1x50, 1x20.
        // Refill Safe with remainders
        for (let row of safeCashArray) {
            let key = row[0] as keyof AcceptedCashValues
            let quantity = row[2]; // Semicolon is crucial here to prevent ASI issues with next line starting with (
            
            // Typescript needs to know this key exists on Monto, which implements AcceptedCashValues
            // Since Monto extends Model, we cast to any or check type safety differently.
            // Using explicit assignment based on key string is safest for tests or using helper.
            (safe as any)[key] = quantity
        }
        await safe.save()

        // Verify Safe state (only remainder)
        expect(safe.cincuenta).toBe(1) // 1x50 remaining
        expect(safe.veinte).toBe(1)    // 1x20 remaining (started with 3, gave 1 to A, 1 to B)
        expect(safe.diez).toBe(0)      // 0x10 remaining (started with 1, gave 1 to B)

        // --- PHASE 5: End of Day Consolidation ---
        // Move everything back to Safe from Registers
        registerA.moveCashTo(safe)
        registerB.moveCashTo(safe)
        
        await safe.save()
        await registerA.save()
        await registerB.save()

        // Verify Registers Empty
        expect(registerA.exportNonEmptyCashArray().length).toBe(0)
        expect(registerB.exportNonEmptyCashArray().length).toBe(0)

        // Verify Safe Total (Should be 170)
        // Safe Remainder: 1x50, 1x20
        // From A: 1x50, 1x20
        // From B: 1x20, 1x10
        // Total Expected: 2x50, 3x20, 1x10
        
        expect(safe.cincuenta).toBe(2)
        expect(safe.veinte).toBe(3)
        expect(safe.diez).toBe(1)
        
        let finalBundle = CashBundle.importFromValidAcceptedCashValues(safe)
        expect(finalBundle.getTotal()).toBe(170)
    })
})
