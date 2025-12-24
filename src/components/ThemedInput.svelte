<!--
Componente que es un input, or si quieres algo más simple para controlar los estilos.

Sus propiedades se controlan desde.
-->
<script lang="ts">
    let { 
        value = $bindable(),
        type = "text",
        placeholder = "",
        disabled = false,
        extraClass = '',
        oninput = null,
        onchange = null
        //id: debería de agregarse pero como está todo con js da igual por comodidad (no está bien)
        } = $props()
</script>

<input 
    class="bg-gray-200 appearance-none w-min border-2 
    border-gray-200 rounded py-2 px-2 text-gray-700 leading-tight 
    focus:outline-none focus:bg-white focus:border-purple-500 {extraClass}"
    type={type}
    bind:value={value}
    placeholder={placeholder}
    oninput={oninput}
    onchange={onchange}
    {disabled}
/>