<!--
Vista para ver y editar los detalles de una cuenta específica.
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import ThemedTextInput from "@components/ThemedTextInput.svelte"
    import ThemedListInput from "@components/ThemedListInput.svelte"
    import Modal from "@components/Modal.svelte"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import CuentasIndexView from "@routes/private/cuentas/index.view.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import type { GETCuentaByIdType, DELETECuentaType, PUTCuentasType } from "@routes/private/cuentas/index.server.mjs"
    import toast from "svelte-french-toast"

    const params = ViewsController.getParameters()
    const cuentaId = params.get('id')

    if (!cuentaId) {
        throw new Error("FATAL: Se requiere un ID de cuenta para esta vista.")
    }

    let cuenta: GETCuentaByIdType.server | null = $state(null)
    let requesting = $state(true)
    let showDeleteModal = $state(false)
    let editedName = $state('')
    let editedPercentage = $state(0)
    let editedIsRemainder = $state(false)

    onMount(async () => {
        requesting = true
        const result = await RequestsManager.makeRequest<GETCuentaByIdType.server, GETCuentaByIdType.client>('GET', `/cuentas/${cuentaId}`)
        if (result) {
            cuenta = result
            editedName = result.name
            editedPercentage = result.percentage
            editedIsRemainder = result.isRemainder
        } else {
            toast.error('No se pudo cargar la información de la cuenta.')
            ViewsController.setCurrentView(CuentasIndexView)
        }
        requesting = false
    })

    async function saveChanges() {
        if (!cuenta) {
            return
        }

        requesting = true
        const result = await RequestsManager.makeRequest<PUTCuentasType.server, PUTCuentasType.client>('PUT', `/cuentas/${cuentaId}`, {
            name: editedName.trim(),
            percentage: editedPercentage,
            isRemainder: editedIsRemainder
        })

        if (result) {
            toast.success(result.message || 'Cuenta actualizada.')
            // Update local state directly
            cuenta.name = editedName.trim()
            cuenta.percentage = editedPercentage
            cuenta.isRemainder = editedIsRemainder
        }
        requesting = false
    }

    async function confirmDelete() {
        showDeleteModal = false
        requesting = true
        const result = await RequestsManager.makeRequest<DELETECuentaType.server, DELETECuentaType.client>('DELETE', `/cuentas/${cuentaId}`)
        
        if (result) {
            toast.success(result.message || 'Cuenta eliminada correctamente.')
            ViewsController.setCurrentView(CuentasIndexView)
        }
        requesting = false
    }

</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            {#if requesting && !cuenta}
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
            {:else if cuenta}
                <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 relative">
                    <h2 class="text-2xl font-semibold text-slate-800 mb-6">Detalles de la Cuenta</h2>
                    <div class="space-y-4">
                        <ThemedTextInput label="Nombre:" bind:value={editedName} disabled={requesting} />
                        {#if !editedIsRemainder}
                            <ThemedTextInput label="Porcentaje:" type="number" bind:value={editedPercentage} disabled={requesting} />
                        {/if}
                        <ThemedListInput 
                            label="Recibe Restante:"
                            bind:value={editedIsRemainder}
                            options={[
                                { label: 'No', value: false },
                                { label: 'Sí', value: true }
                            ]}
                            disabled={requesting}
                        />
                    </div>
                    <div class="mt-6 flex justify-center flex-wrap gap-2">
                        <Themedbutton 
                            label="Guardar Cambios" 
                            onclick={saveChanges}
                            enabled={!requesting}
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
                <Themedbutton label="Volver a Cuentas" onclick={() => ViewsController.setCurrentView(CuentasIndexView)} />
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
            ¿Estás seguro de que quieres eliminar la cuenta <span class="font-semibold">"{cuenta?.name}"</span>?
        </p>
        <p class="text-sm text-amber-600 bg-amber-50 p-3 rounded-md mt-4">
            Atención: La cuenta solo se puede eliminar si su balance es cero. Esta acción no se puede deshacer.
        </p>
        <div class="mt-6 flex justify-center gap-3">
            <Themedbutton label="Cancelar" onclick={() => showDeleteModal = false}/>
            <Themedbutton label="Confirmar borrado" onclick={confirmDelete} extraClass="bg-red-600 hover:bg-red-700" />
        </div>
    </div>
{/snippet}
