<script>
	import { puzzle, puzzleOptions, category, categoryOptions } from '../store';
	import DateRangePicker from './DateRangePicker.svelte';
	import { createEventDispatcher } from 'svelte';
	import NewDateRangePicker from './newDateRangePicker.svelte';

	export let startDate;
	export let endDate;
	export let updateWithDate;
	export let showCatMore;
	export let updateAvgs;

	let precise = false;

	const dispatch = createEventDispatcher();

	function changePuzzle() {
		dispatch('changePuzzle');
	}
	function changeCategories() {
		dispatch('changeCategories');
	}
</script>

<div
	class="bg-base-100 mt-2 py-4 px-2 sm:px-8 border-neutral flex flex-wrap w-full justify-center gap-4 md:gap-8"
>
	<div class=" lg:m-0">
		<div
			class="flex flex-wrap space-x-2 items-center justify-center {precise
				? 'lg'
				: 'md'}:justify-end"
		>
			<div class="items-center form-control">
				<label for="puzzlePicker" class="label">
					<span class="label-text text-sm sm:text-lg font-bold mr-2">Puzzle</span>
					<select
						id="puzzlePicker"
						bind:value={$puzzle}
						selected={$puzzle}
						on:change={() => {
							changePuzzle();
						}}
						class="select select-primary select-md"
					>
						{#each $puzzleOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="items-center form-control">
				<label for="puzzlePicker" class="label">
					<span class="label-text text-sm sm:text-lg font-bold mr-2">Category</span>
					<select
						id="categoryPicker"
						bind:value={$category}
						selected={$category}
						on:change={() => {
							changeCategories();
						}}
						class="select select-primary select-md"
						disabled={$puzzle === 'ALL'}
					>
						{#each $categoryOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>
			</div>

			<button
				type="button"
				class="btn btn-sm"
				on:click={() => (showCatMore = true)}
				disabled={$puzzle === 'ALL'}>...</button
			>
		</div>
	</div>

	<NewDateRangePicker
		bind:constStartDate={startDate}
		bind:constEndDate={endDate}
		on:apply={() => {
			updateWithDate = true;
			updateAvgs();
		}}
	/>


</div>
