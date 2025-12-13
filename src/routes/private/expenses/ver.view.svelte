<!--
Vista para ver y editar los detalles de un gasto específico.
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
    import Modal from "@components/Modal.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import ExpensesIndexView from "@routes/private/expenses/index.view.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETExpenseByIdType, DELETEExpenseType, PUTExpenseType } from "@routes/private/expenses/index.server.mts"
    import toast from "svelte-french-toast"
    import { TipoGasto } from "@data/ExpenseType.mjs"
    import ThemedListInput from "@components/ThemedListInput.svelte"

    const params = ViewsController.getParameters()
    const expenseId = params.get('id')

    if (!expenseId) {
        throw new Error("FATAL: Se requiere un ID de gasto para esta vista.")
    }

    let expense: GETExpenseByIdType.server | null = $state(null)
    let requesting = $state(true)
    let showDeleteModal = $state(false)
    
    let editedName = $state('')
    let editedAmount = $state(0)
    let editedType: TipoGasto = $state(TipoGasto.MENSUAL)

    onMount(async () => {
        requesting = true
        const result = await RequestsManager.makeRequest<GETExpenseByIdType.server, GETExpenseByIdType.client>('GET', `/expenses/${expenseId}`)
        if (result) {
            expense = result
            editedName = result.name
            editedAmount = result.amount
            editedType = result.type
        } else {
            toast.error('No se pudo cargar la información del gasto.')
            ViewsController.setCurrentView(ExpensesIndexView)
        }
        requesting = false
    })

    function hasChanges() {
        if (!expense) return false
        return editedName.trim() !== expense.name || editedAmount !== expense.amount || editedType !== expense.type
    }

    async function saveChanges() {
        if (!expense || !hasChanges()) {
            return
        }

        if (editedName.trim() === '') {
            toast.error('El nombre del gasto no puede estar vacío.')
            return
        }
        if (editedAmount <= 0) {
            toast.error('El monto del gasto debe ser un número positivo.')
            return
        }

        requesting = true
        const body: PUTExpenseType.client = { 
            id: expense.id,
            name: editedName.trim(),
            amount: editedAmount,
            type: editedType
        }
        const result = await RequestsManager.makeRequest<PUTExpenseType.server, PUTExpenseType.client>('PUT', `/expenses/${expenseId}`, body)

        if (result && result.expense && expense) {
            toast.success(result.message || 'Gasto actualizado.')
            expense.name = result.expense.name
            expense.amount = result.expense.amount
            expense.type = result.expense.type as TipoGasto

            editedName = result.expense.name
            editedAmount = result.expense.amount
            editedType = result.expense.type as TipoGasto
        }
        requesting = false
    }

    async function confirmDelete() {
        showDeleteModal = false
        requesting = true
        const result = await RequestsManager.makeRequest<DELETEExpenseType.server, DELETEExpenseType.client>('DELETE', `/expenses/${expenseId}`)
        
        if (result) {
            toast.success(result.message || 'Gasto eliminado correctamente.')
            ViewsController.setCurrentView(ExpensesIndexView)
        }
        requesting = false
    }

</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            {#if requesting && !expense}
                <!-- Esqueleto de carga inicial -->
                <div class="animate-pulse space-y-4 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div class="h-8 w-40 rounded bg-slate-200"></div>
                    <div class="h-10 w-full rounded bg-slate-200"></div>
                    <div class="h-10 w-full rounded bg-slate-200"></div>
                    <div class="h-10 w-full rounded bg-slate-200"></div>
                    <div class="flex gap-2">
                         <div class="h-9 w-24 rounded bg-slate-200"></div>
                         <div class="h-9 w-24 rounded bg-slate-200"></div>
                    </div>
                </div>
            {:else if expense}
                <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 relative">
                    <h2 class="text-2xl font-semibold text-slate-800 mb-6">Detalles del Gasto</h2>
                    <div class="space-y-4">
                        <ThemedTextInput label="Nombre:" bind:value={editedName} disabled={requesting} />
                        <ThemedTextInput label="Monto:" type="number" bind:value={editedAmount} disabled={requesting} />
                        
                        <ThemedListInput
                            label="Tipo:"
                            bind:value={editedType}
                            options={typeOptions}
                            disabled={requesting}
                        />
                    </div>
                    <div class="mt-6 flex justify-center flex-wrap gap-2">
                        <Themedbutton 
                            label="Guardar Cambios" 
                            onclick={saveChanges}
                            enabled={!requesting && hasChanges()}
                        />
                        <Themedbutton 
                            label="Eliminar" 
                            onclick={() => showDeleteModal = true}
                            enabled={!requesting}
                            extraClass="bg-red-600 hover:bg-red-700" 
                        />
                    </div>
                </div>
            {/if}

            <div class="mt-4">
                <Themedbutton label="Volver a Gastos" onclick={() => ViewsController.setDefaultCurrentView(ExpensesIndexView)} />
            </div>
        </div>

        <Modal bind:show={showDeleteModal} children={deleteModalContent} />
    {/snippet}
</DefaultView>

<!-- snippet para el modal de confirmación de borrado -->
{#snippet deleteModalContent()}
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold text-slate-800">Confirmar Eliminación</h3>
        <p class="text-slate-600 mt-2">
            ¿Estás seguro de que quieres eliminar el gasto <span class="font-semibold">"{expense?.name}"</span>?
        </p>
        <p class="text-sm text-red-600 mt-2">
            Esta acción no se puede deshacer.
        </p>
        <div class="mt-6 flex justify-center gap-3">
            <Themedbutton label="Cancelar" onclick={() => showDeleteModal = false}/>
            <Themedbutton label="Confirmar borrado" onclick={confirmDelete} extraClass="bg-red-600 hover:bg-red-700" />
        </div>
    </div>
{/snippet}
