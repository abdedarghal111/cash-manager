<!--
Vista para crear un gasto
-->
<script module lang="ts">
    const typeOptions = [
        { value: TipoGasto.MENSUAL, label: 'Mensual' },
        { value: TipoGasto.ANUAL, label: 'Anual' }
    ]
</script>
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextInput from "@components/ThemedTextInput.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import ExpensesIndexView from "@routes/private/expenses/index.view.svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { POSTExpenseType } from "@routes/private/expenses/index.server.mts"
    import toast from "svelte-french-toast"
    import { TipoGasto } from "@data/ExpenseType.mjs"
    import ThemedListInput from "@components/ThemedListInput.svelte"

    let expenseName = $state('')
    let expenseAmount = $state(0)
    let expenseType: TipoGasto = $state(TipoGasto.MENSUAL)
    let loading = $state(false)

    async function crearGasto() {
        if (expenseName.trim() === '') {
            toast.error('El nombre del gasto no puede estar vacío.')
            return
        }
        if (expenseAmount <= 0) {
            toast.error('El monto del gasto debe ser un número positivo.')
            return
        }
        
        loading = true
        const result = await RequestsManager.makeRequest<POSTExpenseType.server, POSTExpenseType.client>('POST', '/expenses', {
            name: expenseName,
            amount: expenseAmount,
            type: expenseType
        })

        if (result) {
            toast.success('Gasto creado correctamente.')
            ViewsController.setCurrentView(ExpensesIndexView)
        }
        loading = false
    }
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-md mx-auto">
            <h2 class="text-2xl font-semibold text-slate-800 mb-6">Crear Nuevo Gasto</h2>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div class="flex flex-col gap-4">
                    <ThemedTextInput
                        label="Nombre:"
                        bind:value={expenseName}
                    />
                    <ThemedTextInput
                        label="Monto:"
                        type="number"
                        bind:value={expenseAmount}
                    />
                    
                    <ThemedListInput
                        label="Tipo:"
                        bind:value={expenseType}
                        options={typeOptions}
                    />

                    <Themedbutton 
                        label="Crear Gasto" 
                        onclick={crearGasto} 
                        enabled={!loading} 
                    />
                </div>
            </div>

            <div class="mt-4">
                <Themedbutton label="Volver" onclick={() => {
                    ViewsController.setCurrentView(ExpensesIndexView)
                }}/>
            </div>
        </div>
    {/snippet}
</DefaultView>
