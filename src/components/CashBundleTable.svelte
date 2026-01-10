<!--
Componente que muestra los montos como si fuera una tabla partida en multiples columnas para mejor visibilidad
-->

<script module lang="ts">
    // define la cantidad por defecto de elementos por columna
    const ELEMENT_PER_COL = 4
</script>
<script lang="ts">
    import { AcceptedCashEquivalent, type AcceptedCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"

    let { cashValues, extraClass = "", elementPerCol = ELEMENT_PER_COL }: {
        cashValues: AcceptedCashValues,
        extraClass?: string,
        elementPerCol?: number
    } = $props()

    let keyValue = $derived(Object.entries(cashValues) as [keyof AcceptedCashValues, number][])
    let cols = $derived.by(() => {
        // crear nuevo array
        let arr = []  as [keyof AcceptedCashValues, number][][]
        // mover a arrays de 4 elementos
        keyValue.forEach((interArr, i) => {

            // sacar columna
            let pos = Math.trunc(i/elementPerCol)

            // si no existe crearlo
            if (!arr[pos]) {
                arr[pos] = []
            }

            // añadir elemento
            arr[pos].push(interArr)
        })
        // devolver para ser usado como columnas
        return arr
        // return [
        //     keyValue.filter((_, i) => i < 4),
        //     keyValue.filter((_, i) => i >= 4 && i < 8),
        //     keyValue.filter((_, i) => i >= 8)
        // ]
    })
</script>

<!-- 
las tablas generan una de errores con el CSS increible.
Se ha optado por poner border-collapse (para que la tabla no manipule los bordes) y bordear en el div

Tampoco se le puede poner margin al tr, es mas malo que el agua estilizar tablas

Si se usase border-separate entonces podrías manipular los bordes e la tabla pero los del tr se vuelven insoportables
-->
<div class={`flex flex-wrap gap-2 ${" " + extraClass}`}>
    {#each cols as keyValueCol}
    <div class="rounded-md border border-gray-300 w-fit">
        <table class={`border-collapse m-0 p-0`}>
            <tbody>
                {#each keyValueCol as [ key, value ]}
                    <tr class="border-b border-spacing-0 border-gray-300 last:border-b-0">
                        <td class="p-1.5 text-xs font-medium text-right text-gray-500">
                            {AcceptedCashEquivalent[key].toFixed(2)}:
                        </td>
                        <td class="p-1.5 ps-0 font-semibold text-left"> {value} </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/each}
</div>