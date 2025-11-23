<!--
Vista landing, vista inicial de la app

Solo contiene el nombre de la aplicación y pone el texto de cargando.
-->
<script lang='ts'>
    import View from "@components/View.svelte";

</script>

<View>
    {#snippet header()}
        <div class="text-center py-8 bg-blue-700 text-white">
            <h1 class="text-4xl font-bold">Cash Manager</h1>
        </div>
    {/snippet}

    {#snippet main()}
        <div class="flex flex-col items-center justify-center text-center bg-blue-50 h-full">
            <div class="max-w-2xl mx-auto">
                <h2 class="text-3xl mb-4 text-blue-900">Bienvenido</h2>
                <p class="text-lg text-gray-700">La forma más fácil de gestionar tu dinero.</p>
            </div>
        </div>
    {/snippet}

    {#snippet footer()}
        <footer class="text-center py-8 border-t bg-blue-500 text-white">
            <p class="text-sm">&copy; 2025 Cash Manager</p>
        </footer>
    {/snippet}
</View>