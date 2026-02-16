<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import type { POSTExtraccionType } from "./index.server.mjs"
    import { CashBundle } from "@class/CashBundle.mjs";
    import TransactionIdDisplay from "@components/TransactionIdDisplay.svelte";
    import CashBundleDiff from "@components/CashBundleDiff.svelte";
    
    // Obtener parámetros pasados desde la vista anterior
    let params = ViewsController.getParameters()
    
    // Parsear el resultado que viene como objeto
    let transactionResult = params.get('transactionResult') as POSTExtraccionType.server

    if (transactionResult === null) {
        throw new Error("FATAL: Se requiere de un resumen válido para esta vista.")
    }
    
    // total extraido
    let total = CashBundle.importFromValidAcceptedCashValues(transactionResult.extractedCash).getTotal().toFixed(2)
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto py-10 px-4 space-y-6">
            <h2 class="text-3xl text-blue-900 font-bold text-center">Resumen de Extracción</h2>

            <div class="bg-white rounded-lg shadow-md border border-slate-200 p-6 text-center space-y-6">
                
                <div class="flex justify-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </div>

                <div>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">Operación realizada correctamente</h3>
                    <p class="text-slate-500">Extracción registrada de <span class="font-bold text-slate-700">{total}€</span> en efectivo de la cuenta <span class="font-bold text-slate-700">{transactionResult.accountName}</span>.</p>
                </div>

                <!-- Desglose de efectivo -->
                <div class="flex flex-col gap-6 w-full">
                    {#each transactionResult.ConsultedSubAccounts as {subAccountCode, extractedCash}}
                        <div class="flex flex-col items-center">
                            <h4 class="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                Retirar de <span class="font-bold text-blue-600">{subAccountCode}</span> ({CashBundle.importFromValidAcceptedCashValues(extractedCash).getTotal().toFixed(2)}€)
                            </h4>
                            <CashBundleDiff
                                cashValues={extractedCash}
                                extraClass="mx-auto mt-2" 
                            />
                        </div>
                    {/each}
                </div>

                <TransactionIdDisplay uuid={transactionResult.transactionUuid} />

            </div>

            <div class="flex flex-col gap-3">
                <Themedbutton 
                    label="Volver al inicio" 
                    extraClass="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold justify-center"
                    onclick={() => ViewsController.setDefaultCurrentView(LandingView)} 
                />
            </div>
        </div>
    {/snippet}
</DefaultView>
