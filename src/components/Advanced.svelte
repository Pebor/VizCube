<script>
	import { query } from './../database.js';
	import QueryTable from './QueryTable.svelte';

	let queryData = [];
	let error = null;
	let textareaValue = '';

	function processQuery() {
		error = null;
		try {
			queryData = query(textareaValue);
			if (queryData.time) {
			}
		} catch (err) {
			error = err.message;
		}
	}
</script>

<div class="flex flex-col">
	<div class="flex">
		<textarea
			class="textarea textarea-bordered w-full"
			type="text"
			bind:value={textareaValue}
			placeholder="Enter your SQL query here"
		/>

		<button class="btn btn-accent mx-4" on:click={processQuery}>Confirm</button>
	</div>

	{#if error !== null}
		<div class="alert alert-error m-2 w-auto" role="alert">
			<strong class="font-bold">Error:</strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if queryData.length > 0}
		<QueryTable {queryData} />
	{/if}
</div>
