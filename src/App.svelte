<script lang='ts'>
  import { currentView, ViewsController } from '@single/ViewsController.mts';
  import { Toaster } from 'svelte-french-toast';
  import { onMount } from 'svelte';

  onMount(() => {
    // TODO: add restore preview
  })

  console.log($currentView)
</script>

<!-- The actual view -->
<svelte:component this={$currentView} class="bg-sky-500"/>

<!-- The toast functionality -->
<Toaster/>