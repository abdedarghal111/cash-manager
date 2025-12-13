<!--
Vista para listar y ver los gastos
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import CrearExpenseView from "@routes/private/expenses/crear.view.svelte"
    import VerExpenseView from "@routes/private/expenses/ver.view.svelte"
    import { Parameters } from '@class/Parameters.mjs'
    import type { GETExpensesType } from "@routes/private/expenses/index.server.mts"

    let expenses: GETExpensesType.server = $state([])
    let loading = $state(true)

    onMount(async () => {
        loading = true
        const result = await RequestsManager.makeRequest<GETExpensesType.server, GETExpensesType.client>('GET', '/expenses', {})
        
        if (result) {
            expenses = result
        }
        loading = false
    })

</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            <h2 class="text-2xl font-semibold text-slate-800 mb-6">Gastos</h2>

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
                    {:else if expenses.length > 0}
                        {#each expenses as expense}
                            <li class="p-4 flex justify-between items-center gap-3">
                                <span class="text-slate-700">{expense.name} ({expense.type}) - ${expense.amount}</span>
                                <Themedbutton label="Ver" onclick={() => {
                                    let params = new Parameters()
                                    params.set('id', expense.id)
                                    ViewsController.setCurrentView(VerExpenseView, params)
                                }} />
                            </li>
                        {/each}
                    {:else}
                        <li class="p-4 text-center text-slate-500">
                            No hay gastos disponibles.
                        </li>
                    {/if}
                </ul>
            </div>
        </div>

        <div class="max-w-2xl mx-auto mt-6 flex flex-col gap-2">
            <Themedbutton label="Crear Gasto" onclick={() => ViewsController.setCurrentView(CrearExpenseView)} />
            <Themedbutton label="Volver" onclick={() => ViewsController.setDefaultCurrentView(LandingView)} />
        </div>
    {/snippet}
</DefaultView>
