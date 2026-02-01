<!--
Vista setup, vista inicial de la app para configurar la conexión con el servidor

Te muestra el formulario de configuración inicial y te permite ir a la vista de login
-->
<script module lang="ts">
    // Variable que controla si se ha realizado el setup inicial (inicialmente false)
    let initialSetupDone = storable("initialSetupDone", false)
</script>
<script lang='ts'>
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextInput from "@components/ThemedTextInput.svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import { onMount } from "svelte"
    import { storable } from "@class/Storable.client.mjs"
    import { get } from "svelte/store"
    import ThemedCheckboxInput from "@components/ThemedCheckboxInput.svelte";

    let [serverUrl, serverPort, usingHttps] = RequestsManager.getReactiveSettings()

    let inputServerUrl = $state(get(serverUrl))
    let inputServerPort = $state(get(serverPort))
    let inputUsingHttps = $state(get(usingHttps))

    let previewedURL = $derived(`${inputUsingHttps ? 'https' : 'http'}://${inputServerUrl}:${inputServerPort}/`)

    onMount(() => {
        // cada vez que se monte esta vista
        // ver si tampoco hay ningun parámetro desde otra página
        if(ViewsController.getParameters().get("forceInitialSetup")) {
            initialSetupDone.set(false)
        }

        // si ya se ha setupeado en otra ocasion entonces pasar directamente a la pantalla de login
        if(get(initialSetupDone)) {
            ViewsController.setCurrentView(LandingView)
        }
    })

    $effect(() => {
        // actualizar elsetNewSettingsda que se actualicen los campos
        RequestsManager.setNewSettings(inputServerUrl, inputServerPort, inputUsingHttps)
    })
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl mb-4 text-blue-900">Bienvenido</h2>
            <p class="text-lg text-gray-700">La forma más fácil de gestionar tu dinero.</p>
            <p class="text-lg text-gray-700">
                Antes que nada, debes configurar la conexion con el servidor.<br/> 
                Para ello, rellena los siguientes campos detenidamente.<br/> 
                Si te has equivocado, puedes volver desde la pantalla de inicio.
            </p>
        </div>

        <div class="py-5 flex flex-col gap-1">
            <ThemedTextInput label="servidor:" bind:value={inputServerUrl} />
            <ThemedTextInput label="puerto:" bind:value={inputServerPort} />
            <ThemedCheckboxInput label="usar HTTPS:" bind:value={inputUsingHttps} />
        </div>

        <p class="text-sm text-gray-700 mb-4">Se enviaran las peticiones a: {previewedURL}</p>

        <Themedbutton label="Entrar" onclick={() => {
            initialSetupDone.set(true)
            ViewsController.setCurrentView(LandingView)
        }} />
    {/snippet}
</DefaultView>