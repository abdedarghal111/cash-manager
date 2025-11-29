<!--
Vista por defecto

Solo contiene un header y un footer llamativos y centra el main
-->
<script lang='ts'>
    import View from "@components/View.svelte"
    let {
        main
    } = $props()
</script>

<View>
    {#snippet header()}
        <div class="text-center py-8 bg-blue-700 text-white">
            <h1 class="text-4xl font-bold">Cash Manager</h1>
        </div>
    {/snippet}

    {#snippet main()}
        <div class="flex flex-col items-center justify-center text-center bg-blue-50 h-full">
            {@render main()}
        </div>
    {/snippet}

    {#snippet footer()}
        <footer class="text-center py-8 border-t bg-blue-500 text-white">
            <p class="text-sm">&copy; 2025 Cash Manager</p>
        </footer>
    {/snippet}
</View>