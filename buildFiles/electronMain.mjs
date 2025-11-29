import { app, BrowserWindow } from 'electron/main'
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const createWindow = () => {
  // para ignorar los certificados inseguros
  app.commandLine.appendSwitch('ignore-certificate-errors')
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Path from main/electronMain.js to preload/electronPreload.js
      preload: join(__dirname, '../preload/electronPreload.js')
    }
  })

  // Path from main/electronMain.js to renderer/index.html
  if (process.env.ELECTRON_RENDERER_URL) {
    // Si estamos en DEV, cargamos la URL (http://localhost:5173)
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    // Si estamos en PROD, cargamos el archivo html compilado
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  win.webContents.openDevTools()
  win.maximize()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})