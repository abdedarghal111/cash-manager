<!--
La interfaz que contiene la misma estructura para todas las vistas.

Un header, un main y un footer a modo de plantilla.

Este componente solo se encarga de repartir los espacios entre ellos.

Importante que body tenga un height de 100% y el html también para asegurar que wrapper ocupe todo el height.
-->
<script>
    let {
        header = null,
        main,
        footer = null
    } = $props()
</script>

<wrapper class="flex flex-col h-full">
    {#if header}
        <!-- <header class="bg-blue-500"> for debug -->
        <header>
            {@render header()}
        </header>
    {/if}

    <!-- <main class="flex-1 bg-green-500"> -->
    <main class="flex-1">
        {@render main()}
    </main>

    {#if footer}
        <!-- <footer class="bg-red-500"> -->
        <footer>
            {@render footer()}
        </footer>
    {/if}
</wrapper>