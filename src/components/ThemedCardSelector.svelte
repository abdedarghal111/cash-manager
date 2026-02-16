<!-- 
    Componente que consta de cartitas y puedes seleccionar la que quieras, es lo mismo que un select pero con tarjetas.
-->
<script lang="ts">
    type Option = {
        value: any
        label: string
        subLabel?: string
    }

    let { label, value = $bindable(), options, disabled = false }: {
        label?: string,
        value: any,
        options: Option[],
        disabled?: boolean
    } = $props()
</script>

<div class="space-y-2">
    {#if label}
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-blue-900 font-bold text-lg mb-2">{label}</label>
    {/if}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {#each options as option}
            <button 
                class="p-3 rounded-lg border text-left transition-all duration-200 
                    {value === option.value ? 
                        'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' : 
                        'bg-white border-slate-200 hover:bg-slate-50'}
                    {disabled && 'opacity-70 cursor-not-allowed'}"
                onclick={() => { 
                    if(!disabled) {
                        value = option.value
                    }
                }}
                {disabled}
                type="button"
            >
                <div class="font-bold text-base text-slate-800">{option.label}</div>
                {#if option.subLabel}
                    <div class="text-xs mt-1 {value === option.value ? 'text-blue-700 font-medium' : 'text-slate-500'}">
                        {option.subLabel}
                    </div>
                {/if}
            </button>
        {/each}
    </div>
</div>
