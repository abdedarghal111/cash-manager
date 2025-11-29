/**
 * Fichero de rutas, contiene las rutas directas a los archivos de la app haciendo más facil el acceso.
 * 
 * Estas rutas no son relativas a la compilación del proyecto, están pensadas para
 * la post-compilación, eso quiere decir que tendrán en cuenta cuando estén en la carpeta /dist/backend
 * Por lo tanto, la referencia de las mismas no es igual a la que tienen ahora mismo.
 * 
 * Por ejemplo __root apunta a / del proyecto.
 */
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// cuando se ha compilado, la carpeta raiz del proyecto es esa
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const __src = resolve(__dirname, '..')
const __root = resolve(__src, '..', '..')
const __local_data = resolve(__root, 'local_data')
const __test = resolve(__src, 'test')

// export const SESSION_DB_FILE_PATH = resolve(__local_data, 'sessions.sqlite')

export const SERVER_CRT_FILE_PATH = resolve(__local_data, 'server.crt')
export const SERVER_KEY_FILE_PATH = resolve(__local_data, 'server.key')

export const TEST_SERVER_CRT_FILE_PATH = resolve(__test, 'certificates', 'cert.pem')
export const TEST_SERVER_KEY_FILE_PATH = resolve(__test, 'certificates', 'key.pem')

// export const SERVER_CSR_FILE_PATH = resolve(__local_data, 'server.csr')
export const ENV_FILE_PATH = resolve(__local_data, '.env')
export const STORAGE_DB_FILE_PATH = resolve(__local_data, 'storage.sqlite')