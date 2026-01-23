/**
 * Fichero de rutas.
 * Simplemente contiene donde estan todos los paths para que todos los archivos de build sigan el mismo source
 */
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// cuando se ha compilado, la carpeta raiz del proyecto es esa
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const ROOT_PATH = resolve(__dirname, '..', '..')
export const LOCAL_DATA_PATH = resolve(ROOT_PATH, 'local_data')
export const SRC_PATH = resolve(ROOT_PATH, 'src')
export const OUT_PATH = resolve(ROOT_PATH, 'dist')
export const BACKEND_OUT_PATH = resolve(OUT_PATH, 'backend')
export const TEST_OUT_PATH = resolve(BACKEND_OUT_PATH, 'test')
export const TEST_PATH = resolve(SRC_PATH, 'test')

export const TEST_FILES_DIR_PATH = resolve(TEST_PATH, 'testFiles')
export const SERVER_CRT_FILE_PATH = resolve(LOCAL_DATA_PATH, 'https', 'server.crt')
export const SERVER_KEY_FILE_PATH = resolve(LOCAL_DATA_PATH, 'https', 'server.key')
// export const SERVER_CSR_FILE_PATH = resolve(__local_data, 'server.csr')
export const ENV_FILE_PATH = resolve(LOCAL_DATA_PATH, '.env')
export const STORAGE_DB_FILE_PATH = resolve(LOCAL_DATA_PATH, 'storage.sqlite')
export const SERVER_CONFIG_FILE_PATH = resolve(LOCAL_DATA_PATH, 'server.config.json')