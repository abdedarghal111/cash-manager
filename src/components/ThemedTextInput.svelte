<!--
Componente que es un campo de formulario siendo: NombreCampo _ ValorEditable

Sus propiedades se controlan desde fuera, también el tipo.

Responsive:
    - Si la pantalla es estrecha, se muestran en una sola columna.
    - Si la pantalla es grande, se muestran en una sola fila.
-->
<script lang="ts">
    import ThemedInput from "./ThemedInput.svelte"

    let { label, value = $bindable(), type = "text", placeholder = "", disabled = false } = $props()
</script>

<div class="md:flex md:items-center">
    <div class="md:w-1/3">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-blue-900 font-bold md:text-right mb-1 md:mb-0 pr-4">
            {label}
        </label>
    </div>
    <div class="md:w-2/3">
        <ThemedInput
            type={type}
            bind:value={value}
            placeholder={placeholder}
            disabled={disabled}
            extraClass="w-max"
        />
    </div>
</div>