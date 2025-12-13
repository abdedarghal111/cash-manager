<!--
Componente Modal, una ventana encima de la aplicación que no te permite continuar
hasta que la cierres.

básicamente recoger el valor y sus modificaciones con bind: y así 
poder usarlo desde fuera y modificarlo y que reaccione a placer.

Constra de un div centrado por lo que solo hay que crear la parte interior.
-->
<script lang="ts">
    let { show = $bindable(false), children } = $props()

    function close() {
        show = false
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50"
        onclick={close}
    >
        <!-- para evitar que se cierre al hacer click en el fondo -->
        <div onclick={(ev) => ev.stopPropagation()}>
            {@render children()}
        </div>
    </div>
{/if}