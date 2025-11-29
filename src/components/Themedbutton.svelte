<!--
Componente que es un botón simple
-->
<script lang="ts">
    let { label = "", onclick } = $props()
</script>

<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white py-1.5 px-2.5 rounded"
    type="button"
    onclick={onclick}
>
    {label}
</button>