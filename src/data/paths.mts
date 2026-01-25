/**
 * Fichero de rutas, contiene las rutas directas a los archivos de la app haciendo más facil el acceso.
 * 
 * Estas rutas no son relativas a la compilación del proyecto, están pensadas para
 * la post-compilación, eso quiere decir que tendrán en cuenta cuando estén en la carpeta /dist/backend
 * Por lo tanto, la referencia de las mismas no es igual a la que tienen ahora mismo.
 * 
 * Por ejemplo __root apunta a / del proyecto.
 */
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// cuando se ha compilado, la carpeta raiz del proyecto es esa
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const SRC_PATH = resolve(__dirname, '..')
const ROOT_PATH = resolve(SRC_PATH, '..', '..')
export const LOCAL_DATA_PATH = resolve(ROOT_PATH, 'local_data')
const TEST_PATH = resolve(SRC_PATH, 'test')
export const BACKUP_LOCAL_DATA_PATH = resolve(LOCAL_DATA_PATH, 'backup')

export const TEST_FILES_DIR_PATH = resolve(TEST_PATH, 'testFiles')

// export const SESSION_DB_FILE_PATH = resolve(__local_data, 'sessions.sqlite')

export const SERVER_CRT_FILE_PATH = resolve(LOCAL_DATA_PATH, 'https', 'server.crt')
export const SERVER_KEY_FILE_PATH = resolve(LOCAL_DATA_PATH, 'https', 'server.key')

export const SESSIONS_FOLDER_PATH = resolve(LOCAL_DATA_PATH, 'sessions')
export const JWT_PRIVATE_KEY_FILE_PATH = resolve(SESSIONS_FOLDER_PATH, 'private.key')
export const JWT_PUBLIC_KEY_FILE_PATH = resolve(SESSIONS_FOLDER_PATH, 'public.key')

export const TEST_SERVER_CRT_FILE_PATH = resolve(TEST_PATH, 'certificates', 'cert.pem')
export const TEST_SERVER_KEY_FILE_PATH = resolve(TEST_PATH, 'certificates', 'key.pem')

// export const SERVER_CSR_FILE_PATH = resolve(__local_data, 'server.csr')
export const ENV_FILE_PATH = resolve(LOCAL_DATA_PATH, '.env')
export const STORAGE_DB_FILE_PATH = resolve(LOCAL_DATA_PATH, 'storage.sqlite')
export const SERVER_CONFIG_FILE_PATH = resolve(LOCAL_DATA_PATH, 'server.config.json')