<script lang="ts">
    type Option = {
        value: any;
        label: string;
    };

    let { label, value = $bindable(), options, disabled = false } = $props<{
        label: string,
        value: any,
        options: Option[],
        disabled?: boolean
    }>()
</script>

<div class="md:flex md:items-center">
    <div class="md:w-1/3">
        <label class="block text-blue-900 font-bold md:text-right mb-1 md:mb-0 pr-4" for="themed-list-input">
            {label}
        </label>
    </div>
    <div class="md:w-2/3">
        <select
            class="bg-gray-200 border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="themed-list-input"
            bind:value={value}
            {disabled}
        >
            {#each options as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    </div>
</div>
