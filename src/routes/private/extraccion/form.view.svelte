<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextArea from "@components/ThemedTextArea.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETExtraccionCuentasType, POSTExtraccionType } from "./index.server.mjs"
    import { AcceptedCashIterable, type AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"
    import toast from "svelte-french-toast"
    import ExtraccionIndexView from "./index.view.svelte"
    import SummaryView from "./summary.view.svelte"
    import { Parameters } from "@class/Parameters.mjs"
    import { CashBundle } from "@class/CashBundle.mjs"
    import { Validator } from "@single/Validator.mjs";

    // rescatar cuenta
    let params = ViewsController.getParameters()
    let account: GETExtraccionCuentasType.server["accounts"][number] = params.get('account')

    if (account === null) {
        throw new Error("FATAL: Se requiere una cuenta válida para esta vista.")
    }

    // estados
    let processing = $state(false)
    let description = $state('')

    // total disponible para sacar
    let availableCash = account.availableCash
    // // Efectivo disponible
    // let availableTotal = avalibleCash.getTotal()

    // Monto a extraer
    let withdrawalCash = $state(CashBundle.getEmptyCashArray())
    // Total a extraer
    let totalWithdrawal = $derived(CashBundle.importFromValidAcceptedCashValues(withdrawalCash).getTotal())





    function updateCash(key: keyof AcceptedCashValues, difference: number) {
        let available = availableCash[key]
        let newCash = withdrawalCash[key] + difference

        // si la cantidad está en el rango disponible entonces que se aplique
        if (newCash >= 0 && newCash <= available) {
            withdrawalCash[key] = newCash
        }

        return withdrawalCash[key]
    }
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-4xl mx-auto space-y-4 py-4 px-2">
            
            <!-- Encabezado -->
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl text-blue-900 font-bold">Extracción</h2>
                {#if account}
                    <div class="text-right">
                        <p class="text-sm text-slate-500 font-bold">{account.name}</p>
                        <p class="text-xs text-slate-400">Disp: {account.total}€</p>
                    </div>
                {/if}
            </div>

            <div class="flex flex-col items-center bg-white rounded-lg shadow-sm border border-slate-200 p-3 space-y-4">
                <!-- Concepto -->
                <ThemedTextArea 
                    label="Concepto:"
                    bind:value={description}
                    disabled={processing}
                    placeholder="Ej. Compra semanal"
                    rows={2}
                />

                <!-- Selector de Efectivo -->
                <div class="pt-2 border-t border-slate-200">
                    <h3 class="text-lg font-semibold text-slate-800 mb-2">Efectivo</h3>
                    
                    <!-- Grid Móvil Compacto -->
                    <div class="grid grid-cols-3 gap-2">
                        {#each AcceptedCashIterable as [key, cashValue]}
                            <!-- Dinero que queda para ser escogido por el usuario -->
                            {@const available = availableCash[key]}
                            {@const remaining = availableCash[key] - withdrawalCash[key]}
                            {@const current = withdrawalCash[key]}
                            
                            <div class="bg-white border rounded flex flex-col items-center justify-between shadow-sm overflow-hidden h-16
                                {available > 0 ? 'border-slate-300' : 'bg-slate-50 border-slate-200 opacity-60'}
                                {remaining > 0 ? 'ring-1 ring-blue-500/50 border-blue-500 bg-blue-50' : ''}"
                            >
                                <!-- Header: Value & Available -->
                                <div class="w-full flex justify-between items-center px-1.5 py-0.5">
                                    <span class="font-bold text-sm text-slate-800">{cashValue.toFixed(2)}</span>
                                    <span class="{available > 0 ? 'text-blue-500' : 'text-slate-500'} text-xs font-medium bg-slate-100 px-1 py-0.5 rounded-sm">
                                        x{available}
                                    </span>
                                </div>
                                
                                <!-- Controls -->
                                <div class="flex flex-1 border-t border-slate-200 mt-0.5">
                                    <button 
                                        class="px-2 h-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold disabled:opacity-50 transition-colors text-lg"
                                        onclick={() => updateCash(key, -1).toString()}
                                        disabled={current <= 0}
                                        type="button"
                                    >-</button>
                                    
                                    <input 
                                        class="max-w-15 text-center text-sm font-semibold focus:outline-none focus:bg-white p-0 appearance-none"
                                        type="text"
                                        value={current}
                                        oninput={(e) => {
                                            // validar la entrada
                                            let input = e.currentTarget.value
                                            let newValue = Validator.parseInt(input)

                                            if (Validator.isNotValid(newValue)) {
                                                return
                                            }

                                            let diff = newValue - withdrawalCash[key]
                                            e.currentTarget.value = updateCash(key, diff).toString()
                                        }}
                                        disabled={available === 0}
                                    />
                                    
                                    <button 
                                        class="px-2 h-full bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 font-bold disabled:opacity-50 transition-colors text-lg"
                                        onclick={() => updateCash(key, 1).toString()}
                                        disabled={remaining === 0}
                                        type="button"
                                    >+</button>
                                </div>
                            </div>
                        {/each}
                        </div>
                        
                        <!-- Total Sticky -->
                        <div class="mt-4 flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 sticky bottom-0 z-10 shadow-sm">
                            <span class="text-slate-800 font-medium">Total a extraer:</span>
                            <span class="font-bold text-xl text-green-600">{totalWithdrawal.toFixed(2)}€</span>
                        </div>
                </div>
            </div>

            <!-- Botones de Acción -->
            <div class="flex flex-col gap-3 py-2">
                 <Themedbutton 
                    label="Confirmar Extracción"
                    onclick={async () => {
                        let cleanDescription = description.trim()
                        // solo permitir enviar si hay descripción
                        if (cleanDescription === '') {
                            toast.error("Introduce una descripción/concepto.")
                            return
                        }

                        // solo permitir enviar si hay un monto no vacío
                        if (totalWithdrawal <= 0) {
                            toast.error("Debes colocar una cantidad válida para extraer")
                            return
                        }

                        processing = true
                        const result = await RequestsManager.makeRequest<POSTExtraccionType.server, POSTExtraccionType.client>('POST', '/extraccion', {
                            accountId: account.id,
                            description: cleanDescription,
                            cash: withdrawalCash
                        })

                        if (result) {
                            // Navegar a la vista de resumen con los parámetros
                            const params = new Parameters()
                            params.set('transactionResult', result)
                            ViewsController.setCurrentView(SummaryView, params)
                        }
                        processing = false
                    }}
                    enabled={!processing && totalWithdrawal > 0}
                />
                <Themedbutton 
                    label="Volver" 
                    onclick={() => ViewsController.setCurrentView(ExtraccionIndexView)}
                    enabled={!processing}
                />
            </div>
        </div>
    {/snippet}
</DefaultView>
