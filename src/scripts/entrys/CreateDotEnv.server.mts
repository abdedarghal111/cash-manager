/**
 * Script para copiar y pegar el .env.example a .env
 */
import { copyFileSync, existsSync } from 'fs'
import type { EntryType } from '../main.server.mts'
import 'colors'
import { LOCAL_DATA_PATH } from '@data/paths.mjs'
import { resolve } from 'path'

export const main: EntryType = async (rl) => {

    let envPath = resolve(LOCAL_DATA_PATH, '.env')

    if (existsSync(envPath)) {
        return {
            success: false,
            message: 'Ya existe un .env creado.'
        }
    }

    let exampleEnvPath = resolve(LOCAL_DATA_PATH, '.env.example')

    copyFileSync(exampleEnvPath, envPath)

    // devolver el mensaje
    return {
        success: true,
        message: '.env creado correctamente'
    }
}