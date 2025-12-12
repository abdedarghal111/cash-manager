<!--
Vista de registro, para registrar una cuenta
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

    let sending = $state(false)
    let message = $state("")
    let colorStatus = $state("bg-blue-200")
</script>
<script lang='ts'>
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextInput from "@components/ThemedTextInput.svelte"
    import { get } from "svelte/store"
    import { Credentials } from "@single/Credentials.client.mjs"
    import { POSTregister } from "@routes/public/register/index.client.mjs"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"

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
            <p class="text-lg text-gray-700">También puedes registrarte o volver atras dandole al boton de entrar.</p>
        </div>

        {#if message !== ""}
            <p class={`my-3 p-2 ${colorStatus} rounded`}>{message}</p>
        {/if}

        <div class="py-5 flex flex-col gap-1">
            <ThemedTextInput label="usuario:" bind:value={inputUsername} />
            <ThemedTextInput label="constraseña:" bind:value={inputPassword} type="password" />
        </div>

        <div class="flex flex-col gap-2 my-2">
            <Themedbutton label="Registrarse" onclick={async () => {
                sending = true
                let _status = await POSTregister()
                let _message = _status.message
                let status = _status.status
                message = _message
                // si se ha registrado correctamente
                if(status === 201) {
                    status = 200
                    message = _message + ", vuelve atras para iniciar sesión automáticamente."
                    colorStatus = "bg-green-200"
                }else if(status === 403) {
                    // ya existe un usuario registrado
                    colorStatus = "bg-yellow-200"
                }else if(status === 400) {
                    // formulario mal introducido
                    colorStatus = "bg-red-200"
                }
                sending = false
            }} />

            <Themedbutton label="Volver" onclick={() => {
                ViewsController.setCurrentView(LandingView)
            }} />
        </div>
    {/snippet}
</DefaultView>