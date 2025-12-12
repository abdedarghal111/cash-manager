<!--
Vista de login, para iniciar sesión
-->
<script module lang="ts">
    let credentials = Credentials.getReactiveCredentials()
    let username = credentials.username
    let password = credentials.password

    let inputUsername = $state(get(username))
    let inputPassword = $state(get(password))
    username.subscribe((val) => {
        inputUsername = val
    })
    password.subscribe((val) => {
        inputPassword = val
    })
</script>
<script lang='ts'>
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextInput from "@components/ThemedTextInput.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import { get } from "svelte/store"
    import { Credentials } from "@single/Credentials.client.mjs"

    $effect(() => {
        // campos cada que se actualicen los input
        username.set(inputUsername)
        password.set(inputPassword)
    })
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl mb-4 text-blue-900">Iniciar sesión</h2>
            <p class="text-lg text-gray-700">Si volver al menú, también pulsa en el boton de abajo.</p>
        </div>

        <div class="py-5 flex flex-col gap-1">
            <ThemedTextInput label="usuario:" bind:value={inputUsername} />
            <ThemedTextInput label="constraseña:" bind:value={inputPassword} type="password" />
        </div>

        <Themedbutton label="Entrar" onclick={() => {
            ViewsController.setCurrentView(LandingView)
        }} />
    {/snippet}
</DefaultView>