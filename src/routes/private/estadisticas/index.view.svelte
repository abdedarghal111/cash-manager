<!--
Vista donde se muestran las estadísticas de las cuentas
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETEstadisticasType } from "./index.server.mjs"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import Themedbutton from "@components/Themedbutton.svelte"
    import LandingView from "@routes/landing.view.svelte"


    let cuentas: GETEstadisticasType.CuentaStats[] = $state([])
    let error: string | false = $state(false)
    let isLoading: boolean = $state(true)

    onMount(async () => {
        const response = await RequestsManager.makeRequest<GETEstadisticasType.server, GETEstadisticasType.client>(
            'GET',
            '/estadisticas',
            {}
        )

        if (response) {
            cuentas = response.cuentas
        } else {
            error = "Error al cargar las estadísticas."
        }
        isLoading = false
    })
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-4xl mx-auto p-4">
            <h2 class="text-3xl font-bold mb-6 text-blue-800 text-center">Estadísticas</h2>

            {#if isLoading}
                <div class="text-center text-gray-600">Cargando estadísticas...</div>
            {:else if error}
                <p class="text-red-500 text-center">{error}</p>
            {:else}
                <div class="bg-white shadow-lg rounded-xl p-8">
                    <h3 class="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Resumen de Cuentas</h3>
                    {#each cuentas as cuenta (cuenta.id)}
                        <div class="mb-6 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="text-xl font-medium text-gray-700">{cuenta.nombre}</h4>
                                <span class="text-xl font-bold text-green-600">{cuenta.total.toFixed(2)}€</span>
                            </div>
                            {#if cuenta.subcuentas.length > 0}
                                <ul class="ml-6 space-y-1 text-gray-600">
                                    {#each cuenta.subcuentas as subcuenta (subcuenta.id)}
                                        <li class="flex justify-between text-base">
                                            <span>{subcuenta.nombre}</span>
                                            <span>{subcuenta.total.toFixed(2)}€</span>
                                        </li>
                                    {/each}
                                </ul>
                            {:else}
                                <p class="ml-6 text-gray-500 italic">No hay subcuentas.</p>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            <div class="text-center mt-8">
                <Themedbutton
                    label="Volver"
                    onclick={() => ViewsController.setCurrentView(LandingView)}
                />
            </div>
        </div>
    {/snippet}
</DefaultView>
