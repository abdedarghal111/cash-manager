<!--
Vista para ingresar el monto. Permite:
- Previsualizar y modificar gastos a aplicar.
- Previsualizar y configurar la distribución del ingreso entre cuentas con porcentajes.
- Ingresar billetes y monedas para calcular el total.

TODO: añadir el aceptar transacción
-->
<script module lang="ts">
    // diccionario de valores de los billetes en notación numérica (50, 1, 0.50)
    let cashValues = validCashValues
    // diccionario de como se previsualizan
    let displayValues = ["50.00", "20.00", "10.00", "5.00", "2.00", "1.00", "0.50", "0.20", "0.10", "0.05", "0.02", "0.01"]

    // valores por defecto
    let defaultValues = {} as {[key:string]: number}

    // inicializar valores por defecto
    for (let index in cashValues) {
        // extraer el valor de la tabla display
        defaultValues[displayValues[index]!] = 0
    }

    // Variables para la gestión de efectivo (billetes y monedas)
    let cashCounts = storable("lastCashUsed", defaultValues)

    let _cashAccounts = $state(get(cashCounts))
</script>
<script lang="ts">
    import DefaultView from "@components/DefaultView.svelte"
    import Themedbutton from "@components/Themedbutton.svelte"
    import Modal from "@components/Modal.svelte"
    import { onMount } from "svelte"
    import { RequestsManager } from "@single/Requests.client.mjs"
    import { ViewsController } from "@single/ViewsController.client.mjs"
    import LandingView from "@routes/landing.view.svelte"
    import IngresarMontoView from "@routes/private/ingresarMonto/index.view.svelte"
    import verExpenseView from "@routes/private/expenses/ver.view.svelte"
    import crearExpenseView from "@routes/private/expenses/crear.view.svelte"
    import verCuentasView from "@routes/private/cuentas/index.view.svelte"
    import crearCuentasView from "@routes/private/cuentas/crear.view.svelte"
    import summaryView from "@routes/private/ingresarMonto/summary.view.svelte"
    import type { POSTIngresarMontoType, POSTPrevisualizarIngresarMontoType } from "@routes/private/ingresarMonto/index.server.mjs"
    import type { GETExpensesType } from "../expenses/index.server.mjs"
    import type { GETCuentasType } from "../cuentas/index.server.mjs"
    import { TipoGasto } from "@data/enums/ExpenseType.mjs"
    import { Parameters } from "@class/Parameters.mjs"
    import RoundedButton from "@components/RoundedButton.svelte"
    import { get } from "svelte/store"
    import { storable } from "@class/Storable.client.mjs"
    import Fa from "svelte-fa"
    import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons'
    import { validCashValues } from "@data/enums/AcceptedCashEquivalent.mjs"
    import BalancesView from "@routes/private/balances/index.view.svelte"

    // importar cuentas y gastos
    let expenses: GETExpensesType.server = $state([])
    let accounts: GETCuentasType.server = $state([])

    // variables de control
    let loadingExpensesAndCuentas = $state(true)
    let failedMsg = $state('')
    let openPreviewChangesModal = $state(false)
    let loadingPreviewChanges = $state(false)

    // reporte final
    let totalExpenses = $state(0)
    let receivedSummary = $state<POSTPrevisualizarIngresarMontoType.server["summary"]>([])

    // formato un object.entries en un orden correcto
    let _cashOrderedEntries = $derived.by(() => {
        let output = [] as [string, number][]
        for (let key of displayValues) {
            output.push([key, _cashAccounts[key] as number])
        }
        return output
    })

    // calcular el total de dinero disponible
    let totalCashAmount = $derived(_cashOrderedEntries.reduce((sum, [value, count]) => {
        return sum + (parseFloat(value) * count)
    }, 0))

    // función para actualizar la cuenta del metálico
    function updateCash(key: string, change: number) {
        if (_cashAccounts[key] !== undefined && _cashAccounts[key] !== null) {
            _cashAccounts[key] = Math.max(0, _cashAccounts[key] + change)
            cashCounts.set(_cashAccounts)
        }
    }

    // establecer el cash
    function setCash(key: string, newChange: number) {
        if (_cashAccounts[key] !== undefined && _cashAccounts[key] !== null) {
            _cashAccounts[key] = Math.max(0, newChange)
            cashCounts.set(_cashAccounts)
        }
    }

    onMount(async () => {
        loadingExpensesAndCuentas = true
        let requestExpenses = await RequestsManager.makeRequest<GETExpensesType.server, GETExpensesType.client>('GET', '/expenses')
        if(!requestExpenses) {
            failedMsg = 'Error al cargar los gastos'
            loadingExpensesAndCuentas = false
            return
        }
        expenses = requestExpenses

        let requestAccounts = await RequestsManager.makeRequest<GETCuentasType.server, GETCuentasType.client>('GET', '/cuentas')
        if(!requestAccounts) {
            failedMsg = 'Error al cargar las cuentas'
            loadingExpensesAndCuentas = false
            return
        }
        accounts = requestAccounts

        // calcular el total
        expenses.forEach(expense => {
            if (expense.type === TipoGasto.ANUAL) {
                totalExpenses += expense.amount/12
            } else {
                totalExpenses += expense.amount
            }
        })
        // redondear al alza (los gastos siempre es mejor que sean alza)
        totalExpenses = Math.ceil(totalExpenses * 100) / 100

        // ordenar las cuentas de más porcentaje a menos y la que recibe el restante al final
        accounts = accounts.sort((a, b) => {
            if (a.isRemainder) {
                // pasar a al final
                return 1
            } else if (b.isRemainder) {
                // pasar subir sobre b
                return -1
            }
            
            // si a tiene - porcentaje va para al final
            return b.percentage - a.percentage
        })
        
        loadingExpensesAndCuentas = false
    })

</script>

<DefaultView>
    {#snippet main()}
        <div class="max-w-4xl mx-auto space-y-10 py-10">
            <h2 class="text-3xl text-blue-900">Ingresar Monto</h2>

            <!-- Gastos -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 class="text-xl">Gastos</h3>
                    <Themedbutton label="Añadir" onclick={() => {
                        // establecer vista a volver
                        ViewsController.setReturnView(IngresarMontoView)
                        // establecer la nueva vista
                        ViewsController.setCurrentView(crearExpenseView)
                    }} />
                </div>
                <ul class="divide-y divide-slate-200">
                    {#if loadingExpensesAndCuentas}
                        <li class="h-8 w-40 rounded bg-slate-200"></li>
                        <li class="h-10 w-full rounded bg-slate-200"></li>
                        <li class="h-10 w-full rounded bg-slate-200"></li>
                        <li class="h-10 w-full rounded bg-slate-200"></li>
                    {:else if failedMsg !== ''}
                        <li class="p-4 text-center text-red-600">{failedMsg}</li>
                    {:else}
                        {#each expenses as expense}
                            <li class="p-4 flex justify-between items-center gap-3">
                                {expense.name}
                                - {expense.amount}€
                                {#if expense.type === TipoGasto.ANUAL}
                                    <span class="text-sm text-slate-500">Anual</span>
                                {/if}
                                <Themedbutton label="Editar" onclick={() => {
                                    // establecer vista a volver
                                    ViewsController.setReturnView(IngresarMontoView)
                                    // añadir parametros y establecer la nueva vista
                                    let params = new Parameters()
                                    params.set('id', expense.id)
                                    ViewsController.setCurrentView(verExpenseView, params)
                                }} />
                            </li>
                        {/each}
                        <li class="p-4 text-center flex items-center justify-between">
                            <span>Gastos totales:</span> <span class="font-semibold text-red-600">{totalExpenses}€</span>
                        </li>
                    {/if}
                </ul>
            </div>

            <!-- Cuentas -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 ">
                <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 class="text-xl">Cuentas</h3>
                    <Themedbutton label="Añadir" onclick={() => {
                        // establecer vista a volver
                        ViewsController.setReturnView(IngresarMontoView)
                        // establecer la nueva vista
                        ViewsController.setCurrentView(crearCuentasView)
                    }} />
                    </div>
                    <ul class="divide-y divide-slate-200">
                        {#if loadingExpensesAndCuentas}
                            <li class="h-8 w-40 rounded bg-slate-200"></li>
                            <li class="h-10 w-full rounded bg-slate-200"></li>
                            <li class="h-10 w-full rounded bg-slate-200"></li>
                            <li class="h-10 w-full rounded bg-slate-200"></li>
                        {:else if failedMsg !== ''}
                            <li class="p-4 text-center text-red-600">{failedMsg}</li>
                        {:else}
                            {#each accounts as account}
                                <li class="p-4 flex justify-between items-center gap-3">
                                    <span>
                                        {account.name} -
                                        {#if account.isRemainder}
                                            <span class="text-sm text-slate-500"> resto</span>
                                        {:else}
                                            <span class="text-sm text-slate-500"> {account.percentage}%</span>
                                        {/if}
                                    </span>
                                    <Themedbutton label="Editar" onclick={() => {
                                        // establecer vista a volver
                                        ViewsController.setReturnView(IngresarMontoView)
                                        // añadir parametros y establecer la nueva vista
                                        let params = new Parameters()
                                        params.set('id', account.id)
                                        ViewsController.setCurrentView(verCuentasView, params)
                                    }} />
                                </li>
                            {/each}
                    {/if}
                </ul>
            </div>

            <!-- Sección para añadir metálico -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                <div class="p-4 border-b border-slate-200">
                    <h3 class="text-xl">Efectivo</h3>
                </div>
                <div class="p-4 space-y-1">
                    {#each _cashOrderedEntries as [key, cuantity]}
                        <div class="flex items-baseline justify-between gap-2">
                            <RoundedButton
                                extraClass="w-6 h-6"
                                label="-"
                                onclick={() => updateCash(key, -1)}
                            />
                            <RoundedButton
                                extraClass="w-6 h-6"
                                label="+"
                                onclick={() => updateCash(key, 1)}
                            />
                            <div class="text-slate-700 font-medium text-end w-10">{key}</div>
                            <span>x</span>
                            <input
                                class="appearance-none w-10 rounded border border-gray-400 leading-tight focus:outline-none focus:bg-gray-200 p-1 focus:border-purple-500"
                                type="text"
                                value={cuantity}
                                oninput={(event: Event & { currentTarget: EventTarget & HTMLInputElement; }) => {
                                    let tag = (event.target as HTMLInputElement)
                                    let input = parseFloat(tag.value)
                                    setCash(key, isNaN(input) ? 0 : input)
                                    if (isNaN(input)) {
                                        tag.value = String(0)
                                    }
                                }}
                            />
                            <span class="w-20 text-right border bg-gray-100 border-gray-100 text-gray-700 rounded p-1">
                                {(Number(key) * cuantity).toFixed(2)}€
                            </span>
                        </div>
                    {/each}

                    <div class="pt-4 mt-4 border-t border-slate-200">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-semibold text-slate-800">Total efectivo:</span>
                            <span class="text-xl font-bold text-slate-900">{totalCashAmount.toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="py-5 flex flex-col gap-7">
                <Themedbutton label="Ingresar monto" onclick={async () => {
                    loadingPreviewChanges = true
                    openPreviewChangesModal = true
                    failedMsg = ''

                    // realizar petición para ver la previsualización
                    let data = await RequestsManager.makeRequest<POSTPrevisualizarIngresarMontoType.server, POSTPrevisualizarIngresarMontoType.client>('POST', '/previsualizarIngresarMonto', {
                        monto: {
                            cincuenta: _cashAccounts['50.00']!,
                            veinte: _cashAccounts['20.00']!,
                            diez: _cashAccounts['10.00']!,
                            cinco: _cashAccounts['5.00']!,
                            dos: _cashAccounts['2.00']!,
                            uno: _cashAccounts['1.00']!,
                            cerocincuenta: _cashAccounts['0.50']!,
                            ceroveinte: _cashAccounts['0.20']!,
                            cerodiez: _cashAccounts['0.10']!,
                            cerocinco: _cashAccounts['0.05']!,
                            cerodos: _cashAccounts['0.02']!,
                            cerouno: _cashAccounts['0.01']!
                        }
                    })

                    if(!data) {
                        failedMsg = 'Error al cargar los cambios.'
                    } else {
                        receivedSummary = data.summary
                    }

                    loadingPreviewChanges = false
                }} />
                <Themedbutton label="Volver" onclick={() => ViewsController.setCurrentView(LandingView)} />
            </div>
        </div>

        <Modal bind:show={openPreviewChangesModal} children={previewChanges} />
    {/snippet}
</DefaultView>

<!-- New expense modal -->
{#snippet previewChanges()}
    <div class="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 class="text-2xl mb-4">¿Desea Aplicar cambios?</h2>
        <div class="flex justify-between items-center flex-col">
            <!-- mostrar la pantalla de cargando si está el loadingPreviewChanges como en la vista cuentas -->
            {#if loadingPreviewChanges}
                <div class="animate-pulse h-8 w-40 rounded bg-slate-200"></div>
            {:else if failedMsg !== ''}
                <div class="text-red-500">{failedMsg}</div>
            {:else}
                <!-- mostrar la previsualización -->
                <table class="border-separate border-spacing-4">
                    <tbody>
                        {#each receivedSummary as summary}
                            <tr>
                                <td class="text-start">{summary.name}: </td>
                                <td class="text-end">{summary.after}€</td>
                                <td><Fa icon={faArrowRightLong}></Fa></td>
                                <td class="text-end">
                                    {summary.before}€
                                    <span class="text-green-600">(+{(summary.before - summary.after).toFixed(2)}€)</span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
            <div class="flex justify-between items-center mt-4 w-full gap-2">
                {#if failedMsg === ''}
                    <Themedbutton
                        extraClass="bg-green-500 text-white"
                        label="Aplicar"
                        enabled={!loadingPreviewChanges}
                        onclick={async () => {

                            loadingPreviewChanges = true

                            failedMsg = ''

                            // realizar petición para ver la previsualización
                            let data = await RequestsManager.makeRequest<POSTIngresarMontoType.server, POSTIngresarMontoType.client>('POST', '/ingresarMonto', {
                                monto: {
                                    cincuenta: _cashAccounts['50.00']!,
                                    veinte: _cashAccounts['20.00']!,
                                    diez: _cashAccounts['10.00']!,
                                    cinco: _cashAccounts['5.00']!,
                                    dos: _cashAccounts['2.00']!,
                                    uno: _cashAccounts['1.00']!,
                                    cerocincuenta: _cashAccounts['0.50']!,
                                    ceroveinte: _cashAccounts['0.20']!,
                                    cerodiez: _cashAccounts['0.10']!,
                                    cerocinco: _cashAccounts['0.05']!,
                                    cerodos: _cashAccounts['0.02']!,
                                    cerouno: _cashAccounts['0.01']!
                                }
                            })

                            if(!data) {
                                failedMsg = 'Error al aplicar los cambios.'
                                loadingPreviewChanges = false
                                return
                            }

                            // si salió bien la solicitud establecer vista a volver
                            ViewsController.setReturnView(BalancesView)
                            // añadir parametros y establecer la nueva vista
                            let params = new Parameters()
                            params.set('summary', data.summary)
                            ViewsController.setCurrentView(summaryView, params)
                            openPreviewChangesModal = false
                        }}
                    />
                {/if}
                <Themedbutton
                    extraClass="bg-green-500 text-white"
                    label="Cancelar"
                    enabled={!loadingPreviewChanges}
                    onclick={() => {
                        openPreviewChangesModal = false
                    }}
                />
            </div>
        </div>
    </div>
{/snippet}
