<!-- 
Componente que muestra un id de la transacción que le coloques, es un estilo diferente y por eso es un componente.TransactionIdDisplay

Bastante próspero a modificaciones en el futuro debido a que se le puede dar más usos y reusarlo.
-->
<script lang="ts">
    let { uuid, extraClass }: {
        uuid: string,
        extraClass?: string
    } = $props()
</script>

<div class="bg-slate-50 p-4 rounded border border-slate-200 ${" " + extraClass}">
    <p class="text-xs text-slate-500 uppercase font-bold mb-1">ID de Transacción</p>
    <p class="font-mono text-sm break-all text-slate-700">{uuid}</p>
</div>