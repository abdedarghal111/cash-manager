<!-- 
    Vista para seleccionar cuenta de la que extraer el dinero,

    después de seleccionar la cuenta, se pasa la responsabilidad a la siguiente vista (seleccionar cantidad)
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETExtraccionCuentasType } from "./index.server.mjs"
    import toast from "svelte-french-toast"
    import FormView from "./form.view.svelte"
    import { Parameters } from "@class/Parameters.mjs"

    let accounts = $state<GETExtraccionCuentasType.server["accounts"]>([])
    let loading = $state(true)
    let selectedAccount = $state<GETExtraccionCuentasType.server["accounts"][number] | null>(null)

    onMount(async () => {
        loading = true
        const result = await RequestsManager.makeRequest<GETExtraccionCuentasType.server, GETExtraccionCuentasType.client>('GET', '/extraccion/cuentas')
        
        if (result) {
            accounts = result["accounts"]
        } else {
            toast.error("No se pudieron cargar las cuentas.")
        }
        loading = false
    })

</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-4xl mx-auto space-y-4 py-4 px-2">
            
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl text-blue-900 font-bold">Seleccionar Cuenta</h2>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-3 space-y-4">
                {#if loading}
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {#each Array(4) as _}
                            <div class="h-24 w-full rounded bg-slate-200 animate-pulse"></div>
                        {/each}
                     </div>
                {:else if accounts.length === 0}
                    <div class="text-center py-10 text-slate-500">
                        No tienes cuentas disponibles con saldo.
                    </div>
                {:else}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {#each accounts as account}
                            <button 
                                class="p-4 rounded-lg border-2 text-left transition-all duration-200 shadow-sm flex flex-col justify-center h-24 gap-1 {selectedAccount === account ? 'bg-blue-50 border-blue-500 transform scale-[1.02]' : 'bg-white border-slate-200 hover:bg-slate-50'}"
                                onclick={() => selectedAccount = account}
                            >
                                <div class="font-bold text-lg text-slate-800">{account.name}</div>
                                <div class="text-sm text-slate-500 font-medium">
                                    Saldo: <span class="text-slate-800 font-bold">{account.total.toFixed(2)}€</span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="py-2 flex flex-col gap-3">
                 <Themedbutton 
                    label="Seleccionar"
                    onclick={() => {
                        if (selectedAccount) {
                            const params = new Parameters()
                            params.set('account', selectedAccount)
                            ViewsController.setCurrentView(FormView, params)
                        } else {
                            toast.error("Selecciona una cuenta primero.")
                        }
                    }}
                    enabled={selectedAccount !== null}
                    extraClass={`w-full justify-center ${selectedAccount ? "" : "bg-purple-500/50 hover:bg-purple-500/50" }`}
                />
                 <Themedbutton 
                    label="Volver" 
                    onclick={() => ViewsController.setDefaultCurrentView(LandingView)}
                    extraClass="w-full justify-center"
                />
            </div>
        </div>
    {/snippet}
</DefaultView>
