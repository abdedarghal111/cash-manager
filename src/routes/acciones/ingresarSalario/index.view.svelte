<!--
Vista para ingresar un salario y que te devuelve una vista previa de la operación desde el backend
También te permite modificar la tabla de gastos a aplicar.
-->
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import { ViewsController } from "@single/ViewsController.client.mts"
    import LandingView from "@routes/landing.view.svelte"
</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl mb-4 text-blue-900">Ingresar Salario</h2>
            <p class="text-lg text-gray-700">Esta es la vista para ingresar salario.</p>
        </div>

        <div class="py-5 flex flex-col gap-1">
            <Themedbutton label="Volver" onclick={() => ViewsController.setCurrentView(LandingView)} />
        </div>
    {/snippet}
</DefaultView>
