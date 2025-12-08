<!--
Componente que es un campo de formulario siendo: NombreCampo _ ValorEditable

Sus propiedades se controlan desde fuera, también el tipo.

Responsive:
    - Si la pantalla es estrecha, se muestran en una sola columna.
    - Si la pantalla es grande, se muestran en una sola fila.
-->
<script lang="ts">
    let { label, value = $bindable(), type = "text", disabled = false } = $props()
</script>

<div class="md:flex md:items-center">
    <div class="md:w-1/3">
        <label class="block text-blue-900 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name">
            {label}
        </label>
    </div>
    <div class="md:w-2/3">
        <input 
            class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="inline-full-name" 
            type={type}
            bind:value={value}
            {disabled}
        />
    </div>
</div>