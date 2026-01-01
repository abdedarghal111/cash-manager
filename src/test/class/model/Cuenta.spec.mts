import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { User } from "@class/model/User.server.mjs"
import { DatabaseController } from "@single/DatabaseController.server.mjs"
import bcrypt from "bcrypt"

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
describe("Tests de la clase Cuenta", () => {
    it("removeAllIsRemainderForUser", async () => {  
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

    it("removeExcessMarginFromUser", async () => {
        // descntar 40 (debe descontarse de la primera)
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