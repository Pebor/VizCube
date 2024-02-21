<script>
	import LineChartBasic from './LineChartBasic.svelte';
    import { byDate } from './../store.js';

	export let resetMainChart;
	export let updateAvgs;

    let spanGaps = true;
    let points = false;
    let pointsSize = 2;
</script>

<div class="m-auto my-8 p-8 rounded-box border-primary shadow-lg">
	<LineChartBasic bind:spanGaps bind:points bind:pointsSize />
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
			<input type="checkbox" bind:checked={points} class="checkbox" />
			<span class="label-text ml-2 font-bold">Points</span>
		</label>

        <input type="number" class="input input-bordered w-12" hidden={!points} bind:value={pointsSize}>
	</div>
</div>
