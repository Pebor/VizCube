<script>
	import LineChartBasic from './LineChartBasic.svelte';
    import { byDate, mainChart } from './../store.js';
	import { resetZoom } from 'chartjs-plugin-zoom';

	export let updateAvgs;

    let spanGaps = true;
    let points = false;
    let pointsSize = 2;
    let pointsOnly = false;
	let tension = 0;
</script>

<div class="p-2 md:p-8 rounded-box border-primary shadow-lg w-full items-start">
	<div class="relative">
		<LineChartBasic bind:spanGaps bind:points bind:pointsSize bind:pointsOnly bind:tension />
	</div>
	<div class="flex flex-wrap mt-2">
		<button on:click={() => $mainChart.resetZoom()} class="btn btn-neutral"> Reset zoom </button>

		<label class="label cursor-pointer">
			<input type="checkbox" bind:checked={$byDate} class="checkbox" on:change={updateAvgs} />
			<span class="label-text ml-2 font-bold">By date</span>
		</label>

        <label class="label cursor-pointer">
			<input type="checkbox" bind:checked={spanGaps} class="checkbox" />
			<span class="label-text ml-2 font-bold">Span gaps</span>
		</label>

        <label class="label cursor-pointer">
			<input type="range" bind:value={tension} min="0" max="100" step="5" class="range range-sm" />
			<span class="label-text ml-2 font-bold">Tension</span>
		</label>

        <label class="label cursor-pointer">
			<input type="checkbox" bind:checked={points} class="checkbox" on:change={()=>{if(!points) pointsOnly=false}}/>
			<span class="label-text ml-2 font-bold">Points</span>
		</label>

        <input type="number" class="input input-bordered w-12" hidden={!points} bind:value={pointsSize}>

        <label class="label cursor-pointer {points ? '' : 'hidden'}">
			<input type="checkbox" bind:checked={pointsOnly} class="checkbox" />
			<span class="label-text ml-2 font-bold">Points only</span>
		</label>
	</div>
</div>
