<!--
Componente que es un botón simple
-->
<script lang="ts">
    let { label = "", onclick, extraClass = '', enabled = true } = $props()
</script>

<button 
    class="shadow bg-purple-500 hover:bg-purple-400 disabled:bg-purple-300 focus:shadow-outline focus:outline-none text-white py-1.5 px-2.5 rounded {extraClass}"
    type="button"
    onclick={onclick}
    disabled={!enabled}
>
    {label}
</button>