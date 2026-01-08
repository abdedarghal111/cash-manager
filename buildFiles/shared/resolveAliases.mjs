import { existsSync, lstatSync } from 'fs'
import { dirname, relative, resolve } from 'path'

/**
 * Aliases para sustituir en los import (importante cambiarlo también en /tsconfig.json para el interprete de typescript)
 * 
 * @param __src - Ruta al directorio src
 * @returns Objecto con los alias a resolver
 */
export let resolveAliases = (__src) => {
    return {
        "@src": resolve(__src),
        "@components": resolve(__src, 'components'),
        "@single": resolve(__src, 'single'),
        "@class": resolve(__src, 'class'),
        "@assets": resolve(__src, 'assets'),
        "@routes": resolve(__src, 'routes'),
        "@data": resolve(__src, 'data'),
    }
}

/**
 * Aliases para sustituir en los import del servidor
 * 
 * @param __src - Ruta al directorio src
 * @returns Alias de rutas para el servidor
 */
export let resolveServerAliases = (__src) => {
    return {
        '@src/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src)),
        '@components/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'components')),
        '@single/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'single')),
        '@class/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'class')),
        '@assets/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'assets')),
        '@routes/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'routes')),
        '@data/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'data'))
    }
}

/**
 * para devolver un path relativo y que sea escrito en el fichero
 *  - si es una carpeta, añade la barra final (/)
 * 
 * @param fileWhereFounded - Ruta donde se encontró el archivo (usado para calcular la ruta relativa)
 * @param targetPath - Ruta objetivo a la que queremos apuntar
 * @returns Ruta relativa calculada
 */
let replaceRelative = function(fromPath, toPath) {
  // si no son carpetas entonces que se conviertan en tales
  let fromDirPath = fromPath
  if(existsSync(fromPath) && !lstatSync(fromPath).isDirectory()) {
    fromDirPath = dirname(fromDirPath)
  }
  let toDirPath = toPath
  if(existsSync(toPath) && !lstatSync(toPath).isDirectory()) {
    fromDirPath = dirname(toPath)
  }

  // si son la misma carpeta entonces devolver la misma carpeta
  if (fromDirPath === toDirPath) {
    return './'
  }
  // si no pues calcular el path relativo y devolverlo
  let relat = relative(fromDirPath, toDirPath).replace(/\\/g, '/')
  return `./${relat}/`
}