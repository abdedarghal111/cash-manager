<!--
Vista resumen de los cambios que se han hecho, muestra que billetes hay que retirar y introducir en cada subcuenta
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import type { POSTIngresarMontoType } from "@routes/private/ingresarMonto/index.server.mjs"
    import { type AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"
    import { CashBundle } from "@class/CashBundle.mjs"
    import CashBundleDiff from "@components/CashBundleDiff.svelte"

    // rescatar argumentos
    const params = ViewsController.getParameters()
    const summary = $state(params.get('summary')) as POSTIngresarMontoType.server["summary"] | null

    console.log(summary)

    if (!summary) {
        throw new Error("FATAL: Se requiere un ID de cuenta para esta vista.")
    }

    // convierte a cash bundle y cuenta el dinero (debe devolver 0)
    const noChanges = (array: AcceptedCashValues) => CashBundle.importFromValidAcceptedCashValues(array).isEmpty()
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-4xl mx-auto space-y-10 py-10">
            <h2 class="text-3xl text-blue-900 font-bold text-center">Resumen de la Transacción</h2>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 pb-4">
                <div class="p-4 border-b border-slate-200 flex flex-col items-center justify-between text-center">
                    <p class="text-base font-normal text-blue-800 break-all"> {summary.transactionUuid}</p>
                </div>

                {#if summary.cuentasBundleDiff.length !== 0}
                    <h4 class="text-lg text-blue-800 font-bold mt-4">Movimientos en Cuentas</h4>
                    {#each summary.cuentasBundleDiff as cuentaDiff}
                        <h5 class="text-base text-gray-700 font-semibold mt-1">{cuentaDiff.subAccountName} <span class="text-gray-400">- {cuentaDiff.accountName}</span></h5>
                        {#if noChanges(cuentaDiff.diffCash)}
                            <p class="text-gray-500 italic text-center my-4">No hay cambios en la cuenta</p>
                        {:else}
                             <CashBundleDiff 
                                cashValues={cuentaDiff.diffCash}
                                extraClass="mx-auto mt-2" 
                            />
                        {/if}
                    {/each}
                {/if}

                {#if summary.gastosBundleDiff.length !== 0}
                    <h4 class="text-lg text-blue-800 font-bold mt-4">Movimientos en Gastos</h4>
                    {#each summary.gastosBundleDiff as cuentaDiff}
                        <h5 class="text-base text-gray-700 font-semibold mt-1">{cuentaDiff.subAccountName} <span class="text-gray-400">- {cuentaDiff.accountName}</span></h5>
                        {#if noChanges(cuentaDiff.diffCash)}
                            <p class="text-gray-500 italic text-center my-4">No hay cambios en la cuenta</p>
                        {:else}
                            <CashBundleDiff 
                                cashValues={cuentaDiff.diffCash}
                                extraClass="mx-auto mt-2" 
                            />
                        {/if}
                    {/each}
                {/if}
                
                <h4 class="text-lg text-blue-800 font-bold mt-4">Movimientos en Dinero Pendiente</h4>
                <h5 class="text-base text-gray-700 font-semibold mt-1">{summary.cashPendingName}</h5>
                {#if noChanges(summary.cashPendienteDiff)}
                    <p class="text-gray-500 italic text-center my-4">No hay cambios en la cuenta</p>
                {:else}
                    <CashBundleDiff 
                        cashValues={summary.cashPendienteDiff}
                        extraClass="mx-auto mt-2" 
                    />
                {/if}
            </div>

            <Themedbutton label="Volver" onclick={() => ViewsController.setDefaultCurrentView(LandingView)} />
        </div>
    {/snippet}
</DefaultView>
