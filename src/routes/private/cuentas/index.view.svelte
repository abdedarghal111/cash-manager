<!--
Vista donde se previsualizan las cuentas existentes en un orden concreto
y también donde se ve un resumen del historial como subidas o bajadas en porcentaje respecto al mes anterior.
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETCuentasType } from "@routes/private/cuentas/index.server.mjs"
    import CrearCuentaView from "@routes/private/cuentas/crear.view.svelte"
    import VerCuentaView from "@routes/private/cuentas/ver.view.svelte"
    import { Parameters } from '@class/Parameters.mjs'


    let cuentas: GETCuentasType.server = $state([])
    let loading = $state(true)

    onMount(async () => {
        loading = true
        const result = await RequestsManager.makeRequest<GETCuentasType.server, GETCuentasType.client>('GET', '/cuentas')
        
        if (result) {
            cuentas = result
        }
        loading = false
    })

</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            <h2 class="text-2xl font-semibold text-slate-800 mb-6">Cuentas</h2>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                <ul class="divide-y divide-slate-200">
                    {#if loading}
                        {#each Array(3) as _}
                        <li class="p-4">
                            <div class="flex animate-pulse justify-between items-center">
                                <div class="h-8 w-50 rounded bg-slate-200"></div>
                            </div>
                        </li>
                        {/each}
                    {:else if cuentas.length > 0}
                        {#each cuentas as cuenta}
                            <li class="p-4 flex justify-between items-center gap-3">
                                <span class="text-slate-700">{cuenta.name}</span>
                                <Themedbutton label="Ver" onclick={() => {
                                    let params = new Parameters()
                                    params.set('id', cuenta.id)
                                    ViewsController.setCurrentView(VerCuentaView, params)
                                }} />
                            </li>
                        {/each}
                    {:else}
                        <li class="p-4 text-center text-slate-500">
                            No hay cuentas disponibles.
                        </li>
                    {/if}
                </ul>
            </div>
        </div>

        <div class="max-w-2xl mx-auto mt-6 flex flex-col gap-2">
            <Themedbutton label="Crear Cuenta" onclick={() => ViewsController.setCurrentView(CrearCuentaView)} />
            <Themedbutton label="Volver" onclick={() => ViewsController.setCurrentView(LandingView)} />
        </div>
    {/snippet}
</DefaultView>
