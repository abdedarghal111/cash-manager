<!--
Componente que es un checkbox de formulario siendo: ActivadoODesactivado NombreCampo

Sus propiedades se controlan desde fuera, también el tipo.
-->
<script lang="ts">
    let { label, value = $bindable(), nameBefore = false, disabled = false } = $props()

    if (typeof value !== 'boolean') {
        // revisar que siempre se introduzca un valor correcto
        throw new Error('FATAL: Invalid ThemedCheckboxInput value', {
            cause: `Se intentó introducir un valor "${value}" en un componente tipo checkbox que solo acepta booleanos.`
        })
    }
</script>

<div class="md:flex md:items-center">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label class={`block text-blue-900 font-bold md:text-right mb-1 md:mb-0 pr-4 order-${nameBefore ? 1 : 2}`}>
        {label}
    </label>
    <button class={
    `order-${nameBefore ? 2 : 1} ${
        value ? `bg-blue-500 hover:bg-blue-600`
        : `bg-red-500 hover:bg-red-600`
    } transition-all shadow focus:shadow-outline focus:outline-none text-white py-1.5 px-2.5 rounded`
    } onclick={() => {
        value = !value
    }}>
        {#if value === true}
            Si
        {:else}
            No
        {/if}
    </button>
</div>