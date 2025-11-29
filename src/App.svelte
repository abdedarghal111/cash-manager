<script lang='ts'>
  import { currentView } from '@single/ViewsController.client.mts';
  import { Toaster } from 'svelte-french-toast';
</script>
<svelte:boundary onerror={(e) => console.error(e)}><!-- Debug -->
  <!-- The actual view -->
  <svelte:component this={$currentView} class="bg-sky-500"/>

  <!-- The toast functionality -->
  <Toaster/>

  <!-- Error handling -->
  {#snippet failed(error, reset)}
      <p>Oops! {(error as Error).message}</p>
      <button onclick={reset}>Reiniciar aplicación</button>
  {/snippet}
</svelte:boundary><!-- END Debug -->