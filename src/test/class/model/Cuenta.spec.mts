import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { User } from "@class/model/User.server.mjs"
import { DatabaseController } from "@single/DatabaseController.server.mjs"
import bcrypt from "bcrypt"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { Monto } from "@class/model/Monto.server.mjs"
import { CashBundle } from "@class/CashBundle.mjs"

let testUserId = -1

beforeAll(async () => {
    DatabaseController.sync()
    let user = new User()
    user.username = "testUser"
    user.password = bcrypt.hashSync("1234", 10)
    await user.save()

    testUserId = user.id

    // crear varias cuentas
    let cuentasTest = [
        {
            name: "cuenta1",
            percentage: 50
        },
        {
            name: "cuenta2",
            percentage: 30
        },
        {
            name: "cuenta3",
            percentage: 20
        }
    ]

    // guardar las cuentas en la base de datos
    for (let c of cuentasTest) {
        let newCuenta = await Cuenta.create()
        newCuenta.name = c.name
        newCuenta.owner = testUserId
        newCuenta.percentage = c.percentage
        newCuenta.isRemainder = true
        await newCuenta.save()
    }
})

/**
 * Tests básicos para comprobar que funcionan las funcionalidades implementadas
 */
describe("Cuenta class tests", () => {
    it("should remove all isRemainder flags for user", async () => {  
        // testear función      
        Cuenta.removeAllIsRemainderForUser(testUserId)

        // rescatar cuentas
        let cuentas = await Cuenta.findAll({
            where: {
                owner: testUserId,
                ignore: false
            }
        })

        // comprobar que solo tiene uno el remainder
        for (let c of cuentas) {
            expect(c.isRemainder).toBeFalse()
        }
    })

    it("should remove excess margin from user", async () => {
        // descontar 40 (debe descontarse de la primera)
        await Cuenta.removeExcessMarginFromUser(testUserId, 40)

        // comprobar que la primera cuenta tiene 10
        let cuenta1 = await Cuenta.findOne({ where: { name: "cuenta1", owner: testUserId } })
        if (!cuenta1) { throw new Error("La cuenta1 no existe") }
        expect(cuenta1.percentage).withContext("test 1").toBe(10)

        // comprobar que la segunda cuenta tiene 30
        let cuenta2 = await Cuenta.findOne({ where: { name: "cuenta2", owner: testUserId } })
        if (!cuenta2) { throw new Error("La cuenta2 no existe") }
        expect(cuenta2.percentage).withContext("test 2").toBe(30)

        // comprobar que la tercera cuenta tiene 20
        let cuenta3 = await Cuenta.findOne({ where: { name: "cuenta3", owner: testUserId } })
        if (!cuenta3) { throw new Error("La cuenta3 no existe") }
        expect(cuenta3.percentage).withContext("test 3").toBe(20)

        // descontar 15 (debe descontarse de la segunda)
        await Cuenta.removeExcessMarginFromUser(testUserId, 15)

        // comprobar que la primera cuenta tiene 10
        await cuenta1.reload()
        expect(cuenta1.percentage).withContext("test 4").toBe(10)

        // comprobar que la segunda cuenta tiene 30
        await cuenta2.reload()
        expect(cuenta2.percentage).withContext("test 5").toBe(30)

        // comprobar que la tercera cuenta tiene 20
        await cuenta3.reload()
        expect(cuenta3.percentage).withContext("test 6").toBe(20)

        // Añadir a la cuenta 3 un extra y quitar porcentaje
        cuenta3.percentage += 40
        await cuenta3.save()
        expect(cuenta3.percentage).withContext("test 7").toBe(60)

        // quitar 15
        await Cuenta.removeExcessMarginFromUser(testUserId, 15)

        // comprobar que la primera cuenta tiene 10
        await cuenta1.reload()
        expect(cuenta1.percentage).withContext("test 8").toBe(10)

        // comprobar que la segunda cuenta tiene 30
        await cuenta2.reload()
        expect(cuenta2.percentage).withContext("test 9").toBe(30)

        // comprobar que la tercera cuenta tiene 45
        await cuenta3.reload()
        expect(cuenta3.percentage).withContext("test 10").toBe(45)
    })



    describe("getAvailableCash", () => {
        it("New account without subaccounts (returns empty cash)", async () => {
            let cuenta = await Cuenta.create({ name: "empty_acc", owner: testUserId, percentage: 0 })
            let bundle = await cuenta.getAvailableCash()
            
            expect(bundle.getTotal()).toBe(0)
            expect(bundle.isEmpty()).toBeTrue()
            
            await cuenta.destroy()
        })

        it("Account with a single empty subaccount, return everything empty", async () => {
            let cuenta = await Cuenta.create({ name: "single_sub_empty", owner: testUserId, percentage: 0 })
            let sub = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1" })
            
            let bundle = await cuenta.getAvailableCash()
            
            expect(bundle.getTotal()).toBe(0)
            expect(bundle.isEmpty()).toBeTrue()

            let monto = await sub.getMonto()
        
            await monto.destroy()
            await sub.destroy()
            await cuenta.destroy()
        })

        it("Account with multiple subaccounts and amounts, return exactly the sum of all amounts", async () => {
            let cuenta = await Cuenta.create({ name: "multi_sub_money", owner: testUserId, percentage: 0 })
            
            let sub1 = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1", total: 50 })
            let monto1 = await sub1.getMonto()
            monto1.cincuenta = 1 // 50
            await monto1.save()

            let sub2 = await Subcuenta.create({ cuenta: cuenta.id, name: "sub2", total: 40 })
            let monto2 = await sub2.getMonto()
            monto2.veinte = 2 // 40
            await monto2.save()

            let bundle = await cuenta.getAvailableCash()
            
            expect(bundle.cincuenta).toBe(1)
            expect(bundle.veinte).toBe(2)
            expect(bundle.getTotal()).toBe(90)

            await monto1.destroy()
            await sub1.destroy()
            await monto2.destroy()
            await sub2.destroy()
            await cuenta.destroy()
        })

        it("Account with some empty subaccounts and others with amounts, return the sum of the amounts that have money", async () => {
            let cuenta = await Cuenta.create({ name: "mixed_sub_money", owner: testUserId, percentage: 0 })
            
            let sub1 = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1",  total: 10 })
            let monto1 = await sub1.getMonto()
            monto1.diez = 1 // 10
            await monto1.save()

            // Subcuenta vacía (se inicializa vacía al crearse y llamarse getAvailableCash -> getMonto)
            let sub2 = await Subcuenta.create({ cuenta: cuenta.id, name: "sub2" })

            let bundle = await cuenta.getAvailableCash()
            
            expect(bundle.diez).toBe(1)
            expect(bundle.getTotal()).toBe(10)

            await monto1.destroy()
            await sub1.destroy()
            
            let m2 = await sub2.getMonto()
            
            await m2.destroy()
            await sub2.destroy()
            await cuenta.destroy()
        })
    })

    describe("extractCash", () => {
        it("Silly test: empty accounts, empty request", async () => {
            let cuenta = await Cuenta.create({ name: "tonto_vacio", owner: testUserId, percentage: 0 })
            let bundle = new CashBundle() // Vacío
            
            const t = await DatabaseController.startTransaction()
            const result = await cuenta.extractCash(bundle, t)
            await t.commit()
            
            expect(result.satisfied).toBeTrue()
            expect(result.extractedCash.isEmpty()).toBeTrue()
            expect(result.notSatisfiedCash.isEmpty()).toBeTrue()

            await cuenta.destroy()
        })

        it("Empty request, filled account", async () => {
            let cuenta = await Cuenta.create({ name: "solicitud_vacia_llena", owner: testUserId, percentage: 0 })
            let sub = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1" })
            let monto = await sub.getMonto()
            monto.cincuenta = 10
            await monto.save()
            sub.total = 500
            await sub.save()

            let bundle = new CashBundle() // Vacío
            
            const t = await DatabaseController.startTransaction()
            const result = await cuenta.extractCash(bundle, t)
            await t.commit()
            
            expect(result.satisfied).toBeTrue()
            expect(result.extractedCash.isEmpty()).toBeTrue()
            // Asegurar que el dinero sigue ahí
            await monto.reload()
            expect(monto.cincuenta).toBe(10)

            await monto.destroy()
            await sub.destroy()
            await cuenta.destroy()
        })

        it("Money request, empty account", async () => {
            let cuenta = await Cuenta.create({ name: "solicitud_dinero_vacia", owner: testUserId, percentage: 0 })
            // Sin subcuentas o subcuenta vacía
            
            let bundle = new CashBundle()
            bundle.veinte = 1

            const t = await DatabaseController.startTransaction()
            const result = await cuenta.extractCash(bundle, t)
            await t.commit()

            expect(result.satisfied).toBeFalse()
            expect(result.extractedCash.isEmpty()).toBeTrue()
            expect(result.notSatisfiedCash.veinte).toBe(1)
            expect(result.notSatisfiedCash.getTotal()).toBe(20)

            await cuenta.destroy()
        })

        it("Account with surplus money", async () => {
             let cuenta = await Cuenta.create({ name: "surplus", owner: testUserId, percentage: 0 })
             let sub = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1" })
             let monto = await sub.getMonto()
             monto.veinte = 5 // 100
             await monto.save()
             sub.total = 100
             await sub.save()

             let bundle = new CashBundle()
             bundle.veinte = 1 // Solicitar 20

             const t = await DatabaseController.startTransaction()
             const result = await cuenta.extractCash(bundle, t)
             await t.commit()

             expect(result.satisfied).toBeTrue()
             expect(result.extractedCash.veinte).toBe(1)
             expect(result.extractedCash.getTotal()).toBe(20)
             expect(result.notSatisfiedCash.isEmpty()).toBeTrue()
             
             await monto.reload()
             expect(monto.veinte).toBe(4) // 5 - 1 = 4
             await sub.reload()
             expect(sub.total).toBe(80)

             await monto.destroy()
             await sub.destroy()
             await cuenta.destroy()
        })

        it("Account with less money than requested", async () => {
             let cuenta = await Cuenta.create({ name: "deficit", owner: testUserId, percentage: 0 })
             let sub = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1" })
             let monto = await sub.getMonto()
             monto.veinte = 1 // 20
             await monto.save()
             sub.total = 20
             await sub.save()

             let bundle = new CashBundle()
             bundle.veinte = 2 // Solicitar 40

             const t = await DatabaseController.startTransaction()
             const result = await cuenta.extractCash(bundle, t)
             await t.commit()

             expect(result.satisfied).toBeFalse()
             expect(result.extractedCash.veinte).toBe(1) // Obtuvo 1
             expect(result.extractedCash.getTotal()).toBe(20)
             expect(result.notSatisfiedCash.veinte).toBe(1) // Aún necesita 1
             expect(result.notSatisfiedCash.getTotal()).toBe(20)
             
             await monto.reload()
             expect(monto.veinte).toBe(0)
             await sub.reload()
             expect(sub.total).toBe(0)

             await monto.destroy()
             await sub.destroy()
             await cuenta.destroy()
        })

        it("Successful operation with everything (Full flow verify)", async () => {
             // ... Similar al excedente pero quizás distribuido
             let cuenta = await Cuenta.create({ name: "full_success", owner: testUserId, percentage: 0 })
             let sub1 = await Subcuenta.create({ cuenta: cuenta.id, name: "sub1" })
             let monto1 = await sub1.getMonto()
             monto1.cincuenta = 1
             await monto1.save()
             sub1.total = 50
             await sub1.save()

             let sub2 = await Subcuenta.create({ cuenta: cuenta.id, name: "sub2" })
             let monto2 = await sub2.getMonto()
             monto2.veinte = 2
             await monto2.save()
             sub2.total = 40
             await sub2.save()

             let bundle = new CashBundle()
             bundle.cincuenta = 1
             bundle.veinte = 1

             const t = await DatabaseController.startTransaction()
             const result = await cuenta.extractCash(bundle, t)
             await t.commit()

             expect(result.satisfied).toBeTrue()
             expect(result.extractedCash.cincuenta).toBe(1)
             expect(result.extractedCash.veinte).toBe(1)
             expect(result.extractedCash.getTotal()).toBe(70)
             expect(result.notSatisfiedCash.isEmpty()).toBeTrue()
             
             await monto1.reload()
             expect(monto1.cincuenta).toBe(0)
             await sub1.reload()
             expect(sub1.total).toBe(0)
             await monto2.reload()
             expect(monto2.veinte).toBe(1)
             await sub2.reload()
             expect(sub2.total).toBe(20)

             await monto1.destroy()
             await sub1.destroy()
             await monto2.destroy()
             await sub2.destroy()
             await cuenta.destroy()
        })
    })
})

afterAll(async () => {
    // eliminar todas las cuentas relacionadas con el usuario
    await Cuenta.destroy({
        where: { owner: testUserId }
    })

    await User.destroy({
        where: { id: testUserId }
    })
})
