<!--
Vista landing, vista inicial de la app

Solo contiene el nombre de la aplicación y pone el texto de cargando.
-->
<script lang='ts'>
    import View from "@components/View.svelte";

</script>

<View>
    {#snippet header()}
        <h1>A header</h1>
    {/snippet}

    {#snippet main()}
        <div class="">

            <div class="">
                <h2>Test</h2>
            </div>
        </div>
    {/snippet}

    {#snippet footer()}
        <h3>A footer</h3>
    {/snippet}
</View>