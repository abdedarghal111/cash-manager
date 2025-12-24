<!--
Vista landing, la principal, desde aquí se accede a la mayoría de cosas

Se muestra siempre un boton para volver a configurar el servidor
Si existe usuario registrado y el servidor ha confirmado el inicio de sesión,
entonces se muestra el boton de cerrar sesion y acceder las funcionalidades.

En caso contrario se muestra el botón para iniciar sesión o registrarse y se limpia el "registrado"
-->
<script module lang='ts'>
    let status = $state("")
    let showButtons = $state(false)
    let logged = Credentials.getReactiveCredentials().logged
    let colorStatus = $state("bg-blue-200")
</script>
<script lang='ts'>
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import SetupView from "@routes/setup.view.svelte"
    import LoginView from "@routes/public/login/login.view.svelte"
    import RegisterView from "@routes/public/register/index.view.svelte"
    import { Parameters } from "@class/Parameters.mjs"
    import { GETamILogged } from "@routes/private/amILogged/index.client.mjs"
    import { onMount } from "svelte"
    import { Credentials } from "@single/Credentials.client.mjs"
    import Modal from "@components/Modal.svelte"
    import CuentasView from "@routes/private/cuentas/index.view.svelte"
    import IngresarMontoView from "@routes/private/ingresarMonto/index.view.svelte"
    import EstadisticasView from "@routes/private/estadisticas/index.view.svelte"
    import ExpensesIndexView from "@routes/private/expenses/index.view.svelte"

    let showOperarPopup = $state(false)
    let showConfigurarModal = $state(false)

    onMount(async () => {
        // desactivar botones antes de mostrar nada
        status = "Comprobando credenciales..."
        showButtons = false

        // comprobar credenciales
        let username = await GETamILogged()

        // si no se ha podido conectar con el servidor
        if(username === false) {
            status = "Has configurado mal el servidor o está apagado, vuelve a intentarlo (redirección en 5 segundos)."
            colorStatus = "bg-red-200"
            setTimeout(() => {
                let parameters = new Parameters()
                parameters.set("forceInitialSetup", true)
                ViewsController.setCurrentView(SetupView, parameters)
            }, 5000)
        } else if (username === "") {
            // si es un usuario incorrecto
            colorStatus = "bg-yellow-200"
            status = "Conexión correcta, credenciales incorrectas, registrate o inicia sesión."
            Credentials.setLogged(false)
        } else if (username) {
            // se ha conectado correctamente
            colorStatus = "bg-green-200"
            status = `Bienvenido ${username}, credenciales correctas.`
            Credentials.setLogged(true)
        }
        showButtons = true
    })
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl mb-4 text-blue-900">Bienvenido</h2>
            <p class="text-lg text-gray-700">La forma más fácil de gestionar tu dinero.</p>
            <p class={`my-3 p-2 ${colorStatus} rounded`}>{status}</p>
        </div>

        {#if showButtons}
            <div class="flex flex-col gap-2 my-2">
                {#if !$logged}
                    <Themedbutton label="Registrarse" onclick={() => {
                        ViewsController.setCurrentView(RegisterView)
                    }} />
                    <Themedbutton label="Iniciar sesion" onclick={() => {
                        ViewsController.setCurrentView(LoginView)
                    }} />
                {:else}
                    <Themedbutton label="Operar" onclick={() => {
                        showOperarPopup = true
                    }} />
                    <Themedbutton label="Configurar" onclick={() => {
                        showConfigurarModal = true
                    }} />
                    <Themedbutton label="Desconectarse" onclick={() => {
                        Credentials.setLogged(false)
                        status = "Sesión cerrada"
                        colorStatus = "bg-blue-200"
                    }} />
                {/if}

                <Themedbutton label="Configurar url" onclick={() => {
                    let parameters = new Parameters()
                    parameters.set("forceInitialSetup", true)
                    ViewsController.setCurrentView(SetupView, parameters)
                }} />
            </div>
        {/if}

        <Modal bind:show={showOperarPopup} children={operarPopupContent} />
        <Modal bind:show={showConfigurarModal} children={configurarModalContent} />
    {/snippet}
</DefaultView>

<!-- El panel de operaciones -->
{#snippet operarPopupContent()}
    <div class="text-center bg-white p-8 rounded-lg shadow-lg">
        <h3 class="text-2xl mb-6">Opciones de Operación</h3>
        <div class="flex flex-col gap-2">
            <Themedbutton label="Ingresar Monto" onclick={() => {
                ViewsController.setCurrentView(IngresarMontoView)
            }} />
            <Themedbutton label="Estadísticas" onclick={() => {
                ViewsController.setCurrentView(EstadisticasView)
            }} />
            <Themedbutton label="Cerrar" onclick={() => {
                showOperarPopup = false
            }} />
        </div>
    </div>
{/snippet}

<!-- El panel de configuración genérico -->
{#snippet configurarModalContent()}
    <div class="text-center bg-white p-8 rounded-lg shadow-lg">
        <h3 class="text-2xl mb-6">Configuración</h3>
        <div class="flex flex-col gap-2">
            <Themedbutton label="Cuentas" onclick={() => {
                ViewsController.setCurrentView(CuentasView)
            }} />
            <Themedbutton label="Gastos" onclick={() => {
                ViewsController.setCurrentView(ExpensesIndexView)
            }} />
            <Themedbutton label="Cerrar" onclick={() => {
                showConfigurarModal = false
            }} />
        </div>
    </div>
{/snippet}