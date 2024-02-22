<script>
    import { createEventDispatcher } from 'svelte';
    import { currentStartDate, currentEndDate } from '../store';

    export let startDate;
    export let endDate;

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch('apply');
    }
</script>

<div class="flex items-center ml-8 grow justify-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
    <div class="flex">
        <div class="form-control">
            <input type="date" bind:value={$currentStartDate} class="input input-bordered input-md" />
        </div>
        
        <div class="m-auto mx-4"> to </div>
    
        <div class="form-control">
            <input type="date" bind:value={$currentEndDate} class="input input-bordered input-md" />
        </div>
    </div>


    <div class="ml-4 space-x-2">
        <button class="btn btn-sm btn-primary" on:click={handleClick}>Apply</button>

        <button class="btn btn-sm btn-secondary" on:click={() => {
            currentStartDate.set(startDate);
            currentEndDate.set(endDate);
        }}>Reset</button>
    </div>
</div>