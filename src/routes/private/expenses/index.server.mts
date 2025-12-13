/**
 * Endpoint para gestionar los gastos
 */
import express from 'express'
import { asyncErrorHandler } from '@single/HttpController.server.mjs'
import { User } from '@class/model/User.server.mjs'
import { Expense } from '@class/model/Expense.server.mjs'
import { TipoGasto } from "@data/ExpenseType.mjs"
import { Validator } from '@single/Validator.mjs'

// Tipos para GET /expenses
export namespace GETExpensesType {
     export interface client {}
    export type server = {
        id: number
        name: string
        type: TipoGasto
        amount: number
    }[]
}

// Tipos para GET /expenses/:id
export namespace GETExpenseByIdType {
    export interface client {}
    export type server = {
        id: number
        name: string
        type: TipoGasto
        amount: number
    }
}

// Tipos para POST /expenses
export namespace POSTExpenseType {
    export interface client {
        name: string
        amount: number
        type: string 
    }
    export interface server {
        message: string
        expense: {
            id: number
            name: string
            amount: number
            type: string
        }
    }
}

// Tipos para PUT /expenses:id
export namespace PUTExpenseType {
    export interface client {
        id: number
        name: string
        amount: number
        type: string
    }
    export interface server {
        message: string
        expense: {
            id: number
            name: string
            amount: number
            type: string
        }
    }
}

// Tipos para DELETE /expenses:id
export namespace DELETEExpenseType {
    export interface client {}
    export interface server {
        message: string
    }
}

const router = express.Router()

router.get('/expenses', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // recoger los gastos del usuario
    const expenses = await Expense.findAll({
        where: {
            owner: user.id
        }
    })

    // devolver los gastos
    let filteredExpenses: GETExpensesType.server = expenses.map((expense) => {
        return {
            id: expense.id,
            name: expense.name,
            type: expense.type,
            amount: expense.amount
        }
    })
    return res.status(200).json(filteredExpenses as GETExpensesType.server)
}))

router.get('/expenses/:id', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // revisar parámetros
    let expenseId = Validator.parseInt(req.params.id)
    if (Validator.isNotValid(expenseId)) {
        return res.status(400).json({ message: 'El ID del gasto debe ser un número valido' })
    }

    // rescatar y comprobar que exista el gasto
    const expense = await Expense.findOne({
        where: {
            id: expenseId,
            owner: user.id
        }
    })
    if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' })
    }

    // devolver el gasto
    const filteredExpense: GETExpenseByIdType.server = {
        id: expense.id,
        name: expense.name,
        type: expense.type,
        amount: expense.amount
    }

    return res.status(200).json(filteredExpense as GETExpenseByIdType.server)
}))

router.post('/expenses', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // si no hay body entonces salir
    if (!req.body) {
        return res.status(400).json({ message: 'No se proporcionaron datos para crear el gasto' })
    }

    // revisar parámetros
    let validatedName = Validator.string(req.body.name)
    if (Validator.isNotValid(validatedName)) {
        return res.status(400).json({ message: 'El nombre del gasto es inválido' })
    }
    
    let validatedAmount = Validator.number(req.body.amount)
    if (Validator.isNotValid(validatedAmount) || validatedAmount <= 0) {
        return res.status(400).json({ message: 'El monto del gasto debe ser un número positivo' })
    }
    
    let validatedType = Validator.string(req.body.type)
    if (Validator.isNotValid(validatedType) || !Expense.isValidType(validatedType)) {
        return res.status(400).json({ message: 'El tipo de gasto es inválido' })
    }

    // crear el gasto
    const expense = await Expense.create({
        name: validatedName,
        amount: validatedAmount,
        type: validatedType,
        owner: user.id
    })

    // devolver
    return res.status(201).json({ 
        message: 'Gasto creado correctamente', 
        expense: {
            id: expense.id,
            name: expense.name,
            amount: expense.amount,
            type: expense.type
        } 
    } as POSTExpenseType.server)
}))

router.put('/expenses/:id', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User

    // si no hay body entonces salir
    if (!req.body) {
        return res.status(400).json({ message: 'No se proporcionaron datos para crear el gasto' })
    }

    // revisar parámetros
    let expenseId = Validator.parseInt(req.params.id)
    if (Validator.isNotValid(expenseId)) {
        return res.status(400).json({ message: 'El ID del gasto debe ser un número valido' })
    }

    let validatedName = Validator.string(req.body.name)
    if (Validator.isNotValid(validatedName)) {
        return res.status(400).json({ message: 'El nombre del gasto es inválido' })
    }
    
    let validatedAmount = Validator.number(req.body.amount)
    if (Validator.isNotValid(validatedAmount) || validatedAmount <= 0) {
        return res.status(400).json({ message: 'El monto del gasto debe ser un número positivo' })
    }
    
    let validatedType = Validator.string(req.body.type)
    if (Validator.isNotValid(validatedType) || !Expense.isValidType(validatedType)) {
        return res.status(400).json({ message: 'El tipo de gasto es inválido' })
    }

    // rescatar y comprobar que exista el gasto
    const expense = await Expense.findOne({ where: { id: expenseId, owner: user.id } })
    if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' })
    }

    // alterar el gasto
    expense.name = validatedName
    expense.amount = validatedAmount
    expense.type = validatedType as TipoGasto
    await expense.save()

    return res.status(200).json({ 
        message: 'Gasto actualizado correctamente', 
        expense: {
            id: expense.id,
            name: expense.name,
            amount: expense.amount,
            type: expense.type
        } 
    } as PUTExpenseType.server)
}))

router.delete('/expenses/:id', asyncErrorHandler(async (req, res, next) => {
    // @ts-ignore
    const user = req.locals.user as User
    
    // revisar parámetros
    let expenseId = Validator.parseInt(req.params.id)
    if (Validator.isNotValid(expenseId)) {
        return res.status(400).json({ message: 'El ID del gasto debe ser un número valido' })
    }

    // rescatar y comprobar que exista el gasto
    const expense = await Expense.findOne({ where: { id: expenseId, owner: user.id } })
    if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' })
    }

    // borrar el gasto y responder
    await expense.destroy()
    return res.status(200).json({ message: 'Gasto eliminado correctamente' } as DELETEExpenseType.server)
}))

export default router
