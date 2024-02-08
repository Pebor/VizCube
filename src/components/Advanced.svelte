<script>
	import { query } from './../database.js';
	import { formatTime } from './../utils.js';

	let queryData = [];
	let error = null;
	let textareaValue = '';

	const formatableKey = ['time', 'avg5', 'avg12', 'avg50', 'avg100', 'avg1000'];

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
		<table class="table table-zebra w-full">
			<thead>
				<tr>
					{#each Object.keys(queryData[0]) as column}
						<th>{column}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each queryData as row}
					<tr>
						{#each Object.entries(row) as [key, value]}
							<td>{formatableKey.includes(key) && value != null ? formatTime(value) : value}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
