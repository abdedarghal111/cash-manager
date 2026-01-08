<!--
Componente que es un botón redondo con pocos carácteres

Lo ideal es poner en extraclass el tamaño del botón (w-7 h-7 o lo que se necesite)
-->
<script lang="ts">
    let { label = "", onclick, extraClass = '', enabled = true } = $props()
</script>

<button
        class="aspect-square flex items-center justify-center bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed {extraClass}"
        type="button"
        onclick={onclick}
        disabled={!enabled}
    >
    {label}
</button>