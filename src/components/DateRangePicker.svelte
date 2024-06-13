<script>
	import { createEventDispatcher } from 'svelte';
	import { currentStartDate, currentEndDate } from '../store';

	export let startDate;
	export let endDate;

	export let precise = false;

	let timeValue;

	const dispatch = createEventDispatcher();

	function handleClick() {
		const currentDate = new Date();
		let newStartDate, newEndDate;

		switch (timeValue) {
			case '1day':
				newStartDate = new Date(currentDate);
				newEndDate = new Date(currentDate);
				break;
			case '1week':
				newStartDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
				newEndDate = new Date(currentDate);
				break;
			case '1month':
				newStartDate = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth() - 1,
					currentDate.getDate()
				);
				newEndDate = new Date(currentDate);
				break;
			case '3months':
				newStartDate = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth() - 3,
					currentDate.getDate()
				);
				newEndDate = new Date(currentDate);
				break;
			case '6months':
				newStartDate = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth() - 6,
					currentDate.getDate()
				);
				newEndDate = new Date(currentDate);
				break;
			case '1year':
				newStartDate = new Date(
					currentDate.getFullYear() - 1,
					currentDate.getMonth(),
					currentDate.getDate()
				);
				newEndDate = new Date(currentDate);
				break;
		}

		if (timeValue !== 'all') {
			currentStartDate.set(newStartDate.toISOString().split('T')[0]);
			currentEndDate.set(newEndDate.toISOString().split('T')[0]);
		} else {
			currentStartDate.set(startDate);
			currentEndDate.set(endDate);
		}

		dispatch('apply');
	}

	function handleSelect() {
		switch (timeValue) {
			case 'precise':
				precise = true;
				break;
		}
	}
</script>

<div class="flex items-center justify-center space-x-4 flex-row">
	{#if precise}
		<div class="flex">
			<div class="form-control">
				<input type="date" bind:value={$currentStartDate} class="input input-md input-secondary" />
			</div>

			<div class="m-auto mx-4">to</div>

			<div class="form-control">
				<input type="date" bind:value={$currentEndDate} class="input input-md input-secondary" />
			</div>
		</div>
	{:else}
		<select
			class="select select-bordered select-md select-secondary"
			bind:value={timeValue}
			on:change={handleSelect}
		>
			<option value="all">From first</option>
			<option value="precise">Precise</option>
			<option value="1day">last 1 day</option>
			<option value="1week">last 1 week</option>
			<option value="1month">last 1 month</option>
			<option value="3months">last 3 months</option>
			<option value="6months">last 6 months</option>
			<option value="1year">last 1 year</option>
		</select>
	{/if}

	<div class="space-x-2 flex">
		<button class="btn btn-sm btn-success" on:click={handleClick}>Apply</button>

		{#if precise}
			<button
				class="btn btn-sm btn-error btn-outline"
				on:click={() => {
					currentStartDate.set(startDate);
					currentEndDate.set(endDate);
					precise = false;
				}}>back</button
			>
		{/if}
	</div>
</div>
