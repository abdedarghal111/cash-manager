import { existsSync, glob, globSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'fs'
import esbuild from 'esbuild'
import { replace } from 'esbuild-plugin-replace'
import { copy } from 'esbuild-plugin-copy'
import { fileURLToPath } from 'url'
import { dirname, join, relative, resolve } from 'path';
import c from 'colors'
/*
Parámetros disponibles:
--dev  => compilar para desarrollo
--no-clean    => no realiza la limpieza
--clean       => realiza limpieza de directorios (por defecto)
*/

const __filename = fileURLToPath(import.meta.url)
const __processDir = process.cwd()
const __dirname = dirname(__filename)
const __root = join(__dirname, '..')
const __dist = join(__root, 'dist', 'backend')
const __src = join(__root, 'src')
// este src relativo sirve específicamente para prevenir errores en búsquedas etc
const __relativeSrc = relative(__processDir, __src)
// const __entry = join(__src, 'main.server.mts')

let checkParam = par => process.argv.find(val => val === par)

// limpieza
if (existsSync(__dist) && !checkParam('--no-clean') && !checkParam('--watch')) {
  let files = readdirSync(__dist)
  let emptyDist = files.length === 0 || (files.length === 1 && files[0] === 'data')
  if (!emptyDist) { console.log('\n==> Limpiando carpeta de compilación...'.yellow) }
  for (const file of files) {
    // si es node_modules y no se pasa el parámetro --clean, se salta
    if(file === 'node_modules' && !checkParam('--clean')) continue
    // borrar todos los archivos (excepto node_modules)
    const filePath = join(__dist, file)
    rmSync(filePath, { recursive: true, force: true })
    console.log(`  -> ${file} borrado`.cyan)
  }
  console.log('\n==> Carpeta de compilación limpia'.green)
}

// para devolver un path relativo y que sea escrito en el fichero
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


if (checkParam('--dev')) {
  let entryPoints = globSync(`${__relativeSrc}/**/*.mts`)
  entryPoints = entryPoints.filter(file => !file.endsWith('.client.mts'))

  // configuración para produccion
  let ctx = await esbuild.context({
    logLevel: 'info',
    entryPoints: entryPoints,
    sourceRoot: __src,
    outdir: __dist,
    bundle: false,
    minify: false,
    sourcemap: false,
    target: 'es2022',
    platform: 'node',
    format: 'esm',
    outExtension: {
      '.js': '.mjs'
    },
    resolveExtensions: ['.mts'],
    tsconfig: './tsconfig.json',
    plugins: [
      replace({
        include: /\.mts$/, // solo incluir todos los scripts
        delimiters: ['', ''], // tener esta opción para que no haga cosas raras y funcione de la manera más simple
        values: {
          '.mts': '.mjs',
          '@src/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src)),
          '@components/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'components')),
          '@single/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'single')),
          '@class/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'class')),
          '@assets/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'assets')),
          '@routes/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'routes')),
          '@data/': (fileWhereFounded) => replaceRelative(fileWhereFounded, resolve(__src, 'data'))
        }
      }),
      copy({
        assets: [
          {
            // añadir aquí los ficheros a copiar
            from: [
              `${__relativeSrc}/**/*.txt`,
              `${__relativeSrc}/**/*.img`,
              `${__relativeSrc}/**/*.json`,
              `${__relativeSrc}/**/*.pem`,
            ],
            to: [__dist],
          },
        ],
        // copyOnStart: true,
        // verbose: true
      })
    ]
  })

  // Crear enlace simbólico para node_modules
  const nodeModulesSrc = join(__root, 'node_modules')
  const nodeModulesDest = join(__dist, 'node_modules')

  // ver si existe enlace simbolico
  let exists = false
  try {
    // recoger el fichero
    const stats = lstatSync(nodeModulesDest)
    if (stats.isSymbolicLink()) {
      // en caso de que sea un enlace simbólico
      exists = true
    } else {
      // en caso de que no sea un enlace simbólico
      console.log(`  -> ATENCIÓN: EXISTE UN ARCHIVO EN LA RUTA ${nodeModulesDest} Y NO ES UN SYMBOLIC LINK A ${nodeModulesSrc} PORFAVOR BORRARLO`.red)
      process.exit(1)
    }
    
  } catch (err) {
    // en caso de que no exista
    if (err.code === 'ENOENT') {
      exists = false
    }else {
      console.log(`  -> Un error desconocido ha ocurrido al intentar acceder a ${nodeModulesDest}:`.red)
      console.error(err)
      process.exit(1)
    }
  }

  // si no existe el enlace entonces lo creamos
  if (!exists) {
    console.log('\n==> Creando symlink para node_modules...'.yellow)
    try {
      mkdirSync(dirname(nodeModulesDest), { recursive: true })
      symlinkSync(nodeModulesSrc, nodeModulesDest, 'junction')
      console.log('  -> Symlink para node_modules creado'.cyan)
    } catch (error) {
      console.error('  -> Error al crear el symlink:'.red, error)
    }
  }

  if (!checkParam('--watch')) {
    await ctx.rebuild()

    ctx.dispose()
  } else {
    await (async () => {
      ctx.watch()
    })()
  }
} else {
  if (!checkParam('--clean')) {
    console.log(c.yellow('\n==> Aviso: No se ha especificado ') + c.red('--production') + c.yellow(' o ') + c.red('--dev') + c.yellow(' como parámetro'))
    console.log('==> Cancelando...'.yellow)
  }
}

console.log('\n==> Cadena de compilación finalizada\n'.green)