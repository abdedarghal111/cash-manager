<script lang='ts'>
  document.body.style.height = `${window.innerHeight}px`
</script>

<svelte:window on:resize={(e) => {
  document.body.style.height = `${window.innerHeight}px`
}}></svelte:window>

<h1>Okay it works</h1>