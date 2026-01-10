<script lang="ts">
    import { CashBundle } from "@class/CashBundle.mjs";
    import { AcceptedCashEquivalent, type AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"

    let { cashValues, extraClass = "" }: {
        cashValues: AcceptedCashValues,
        extraClass?: string
    } = $props()

    let keyValue = $derived(Object.entries(CashBundle.importFromValidAcceptedCashValues(cashValues)) as [keyof AcceptedCashValues, number][])
</script>

<!-- 
las tablas generan una de errores con el CSS increible.
Se ha optado por poner border-collapse (para que la tabla no manipule los bordes) y bordear en el div

Tampoco se le puede poner margin al tr, es mas malo que el agua estilizar tablas

Si se usase border-separate entonces podrías manipular los bordes e la tabla pero los del tr se vuelven insoportables
-->
<div class="rounded-md border border-gray-300 w-fit ${" " + extraClass}">
    <table class={`border-collapse m-0 p-0`}>
        <tbody>
            {#each keyValue as [ key, value ]}
                {#if value !== 0}
                    <tr class="border-b border-spacing-0 border-gray-300 last:border-b-0">
                        <td class="p-1.5 font-medium text-right text-gray-700">
                            {AcceptedCashEquivalent[key]!.toFixed(2)}:
                        </td>
                        <td class={`p-1.5 font-semibold text-left text-${value > 0 ? 'green' : 'red'}-600`}>
                            {value > 0 ? "+" : "-"} {value}
                        </td>
                    </tr>
                {/if}
            {/each}
        </tbody>
    </table>
</div>