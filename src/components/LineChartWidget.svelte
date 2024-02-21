<script>
	import LineChartBasic from './LineChartBasic.svelte';
    import { byDate } from './../store.js';

	export let resetMainChart;
	export let updateAvgs;

    let spanGaps = true;
    let points = false;
    let pointsSize = 2;
    let pointsOnly = false;
</script>

<div class="m-auto my-8 p-8 rounded-box border-primary shadow-lg">
	<LineChartBasic bind:spanGaps bind:points bind:pointsSize bind:pointsOnly />
	<div class="flex">
		<button on:click={() => resetMainChart()} class="btn btn-neutral"> Reset zoom </button>

		<label class="label cursor-pointer">
			<input type="checkbox" bind:checked={$byDate} class="checkbox" on:change={updateAvgs} />
			<span class="label-text ml-2 font-bold">By date</span>
		</label>

        <label class="label cursor-pointer">
			<input type="checkbox" bind:checked={spanGaps} class="checkbox" />
			<span class="label-text ml-2 font-bold">Span gaps</span>
		</label>

        <label class="label cursor-pointer">
			<input type="checkbox" bind:checked={points} class="checkbox" on:change={()=>{if(!points) pointsOnly=false}}/>
			<span class="label-text ml-2 font-bold">Points</span>
		</label>

        <input type="number" class="input input-bordered w-12" hidden={!points} bind:value={pointsSize}>

        <label class="label cursor-pointer {!points ? 'hidden' : ''}" >
			<input type="checkbox" bind:checked={pointsOnly} class="checkbox" />
			<span class="label-text ml-2 font-bold">Points only</span>
		</label>
	</div>
</div>
