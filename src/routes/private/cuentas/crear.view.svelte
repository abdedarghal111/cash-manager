<!--
Vista para crear una nueva cuenta.
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextInput from "@components/ThemedTextInput.svelte"
    import ThemedListInput from "@components/ThemedListInput.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import CuentasIndexView from "@routes/private/cuentas/index.view.svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { POSTCuentasType } from "@routes/private/cuentas/index.server.mjs"
    import toast from "svelte-french-toast"
    import { Parameters } from "@class/Parameters.mjs"

    let cuentaName = $state('')
    let percentage = $state(0)
    let isRemainder = $state(false)
    let loading = $state(false)

    async function crearCuenta() {
        // primero validar
        if (cuentaName.trim() === '') {
            toast.error('El nombre de la cuenta no puede estar vacío.')
            return
        }
        
        loading = true
        const result = await RequestsManager.makeRequest<POSTCuentasType.server, POSTCuentasType.client>('POST', '/cuentas', {
            name: cuentaName,
            percentage: percentage,
            isRemainder: isRemainder
        })

        if (result) {
            toast.success('Cuenta creada correctamente.')
            // preparar la vista y enviarla
            let parameters = new Parameters()
            parameters.set('id', result.id)
            ViewsController.setDefaultCurrentView(CuentasIndexView, parameters)
        }
        loading = false
    }
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-md mx-auto">
            <h2 class="text-2xl font-semibold text-slate-800 mb-6">Crear Nueva Cuenta</h2>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div class="flex flex-col gap-4">
                    <ThemedTextInput
                        label="Nombre:" 
                        bind:value={cuentaName}
                    />
                    {#if !isRemainder}
                        <ThemedTextInput
                            label="Porcentaje:" 
                            type="number"
                            bind:value={percentage}
                        />
                    {/if}
                    <ThemedListInput
                        label="Recibe Restante:"
                        bind:value={isRemainder}
                        options={[
                            { label: 'No', value: false },
                            { label: 'Sí', value: true }
                        ]}
                    />

                    <Themedbutton 
                        label="Crear Cuenta" 
                        onclick={crearCuenta} 
                        enabled={!loading} 
                    />
                </div>
            </div>

            <div class="mt-4">
                <Themedbutton label="Volver" onclick={() => {
                    ViewsController.setDefaultCurrentView(CuentasIndexView)
                }}/>
            </div>
        </div>
    {/snippet}
</DefaultView>
