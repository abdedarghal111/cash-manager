<!--
Componente que es un textarea estilizado.
-->
<script lang="ts">
    let { 
        label,
        value = $bindable(),
        placeholder = "",
        disabled = false
    } = $props()
</script>

<div class="flex flex-col md:flex-row">
    <div class="md:w-1/3">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-blue-900 font-bold mb-1 md:mb-0 pr-4">
            {label}
        </label>
    </div>
    <div class="md:w-2/3">
        <textarea
            class="bg-gray-200 appearance-none w-full border-2 
            border-gray-200 rounded py-2 px-2 text-gray-700 leading-tight 
            focus:outline-none focus:bg-white focus:border-purple-500 resize-y"
            bind:value={value}
            {placeholder}
            {disabled}
        ></textarea>
    </div>
</div>
