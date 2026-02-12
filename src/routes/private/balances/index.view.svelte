<!--
Vista donde se previsualizan las subcuentas y cuentas con todo el dinero que contienen
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETBalancesType } from "./index.server.mjs"
    import CashBundleTable from "@components/CashBundleTable.svelte"
    import { CashBundle } from "@class/CashBundle.mjs";

    let summary = $state({}) as GETBalancesType.server['summary']
    let error: string | false = $state(false)
    let isLoading: boolean = $state(true)

    onMount(async () => {
        const response = await RequestsManager.makeRequest<GETBalancesType.server, GETBalancesType.client>(
            'GET',
            '/balances',
            {}
        )

        if (response) {
            summary = response.summary
        } else {
            error = "Error al cargar las estadísticas."
        }
        isLoading = false
    })
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-4xl mx-auto space-y-10 py-10">
            <h2 class="text-3xl text-blue-900 font-bold text-center">Balances</h2>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">

                {#if isLoading}
                <div class="text-center text-gray-600">Cargando estadísticas...</div>
                {:else if error}
                    <p class="text-red-500 text-center">{error}</p>
                {:else}

                    <!-- <h4 class="text-lg text-blue-800 font-bold mt-4">Movimientos en Cuentas</h4> -->
                    {#each summary.cuentas as cuenta}
                        <h4 class="text-xl text-blue-700 font-semibold mt-1 mb-2">{cuenta.accountName}</h4>
                        {#each cuenta.subaccounts as subcuenta}
                            <h6 class="text-blue-500 font-semibold text-start">Subcuenta {subcuenta.subAccountName}</h6>
                            <ul class="text-start [&_li]:text-sm [&_li]:font-semibold [&_span]:font-normal [&_span]:text-xs [&_span]:text-gray-500">
                                <li>
                                    <span>- Total:</span>
                                    {subcuenta.total}
                                    <span>€</span>
                                </li>
                                <li>
                                    <span>- Pendiente:</span>
                                    {subcuenta.totalPending}
                                    <span>€</span>
                                </li>
                                <li>
                                    <span>- TotalMonto:</span>
                                    {CashBundle.importFromValidAcceptedCashValues(subcuenta.cash).getTotal()}
                                    <span>€</span>
                                </li>
                            </ul>
                            <CashBundleTable
                                cashValues={subcuenta.cash}
                                extraClass="mx-auto my-2 mb-5"
                            />
                        {/each}
                        {#if cuenta.subaccounts.length === 0}
                            <p class="text-gray-600 text-sm text-center">No hay subcuentas.</p>
                            <p class="text-gray-600 text-sm text-center mb-5">Total: 0€</p>
                        {/if}
                    {/each}

                    <!-- <h4 class="text-lg text-blue-800 font-bold mt-4">Cuenta </h4> -->
                    <h4 class="text-base text-blue-700 font-semibold mt-1">{summary.gastosCuenta.accountName}</h4>
                    {#each summary.gastosCuenta.subaccounts as subcuenta}
                        <h6 class="text-blue-500 font-semibold text-start">Subcuenta {subcuenta.subAccountName}</h6>
                        <ul class="text-start [&_li]:text-sm [&_li]:font-semibold [&_span]:font-normal [&_span]:text-xs [&_span]:text-gray-500">
                            <li>
                                <span>- Total:</span>
                                {subcuenta.total}
                                <span>€</span>
                            </li>
                            <li>
                                <span>- Pendiente:</span>
                                {subcuenta.totalPending}
                                <span>€</span>
                            </li>
                            <li>
                                <span>- TotalMonto:</span>
                                {CashBundle.importFromValidAcceptedCashValues(subcuenta.cash).getTotal()}
                                <span>€</span>
                            </li>
                        </ul>
                        <CashBundleTable
                            cashValues={subcuenta.cash}
                            extraClass="mx-auto my-2 mb-5"
                        />
                    {/each}
                
                    <h4 class="text-base text-blue-700 font-semibold mt-1">{summary.cashPendingName}</h4>
                    <ul class="text-start [&_li]:text-sm [&_li]:font-semibold [&_span]:font-normal [&_span]:text-xs [&_span]:text-gray-500">
                        <li>
                            <span>- TotalMonto:</span>
                            {CashBundle.importFromValidAcceptedCashValues(summary.cashPendienteCash).getTotal()}
                            <span>€</span>
                        </li>
                    </ul>
                    <CashBundleTable
                        cashValues={summary.cashPendienteCash}
                        extraClass="mx-auto my-2 mb-5"
                    />

                {/if}
            </div>

            <Themedbutton label="Volver" onclick={() => ViewsController.setDefaultCurrentView(LandingView)} />
        </div>
    {/snippet}
</DefaultView>