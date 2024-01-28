<script>
	import { query } from './../database.js';
	import { formatTime } from './../utils.js';

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
	<textarea
		class="border rounded p-2 mb-2 resize-both w-1/3"
		type="text"
		bind:value={textareaValue}
		placeholder="Enter your SQL query here"
	/>

	<div class="flex">
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={processQuery}>Confirm</button
		>
	</div>

	{#if error !== null}
		<div
			class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
			role="alert"
		>
			<strong class="font-bold">Error:</strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if queryData.length > 0}
		<div class="w-2/3">
			<table class="border-collapse border border-gray-300 bg-white text-gray-800">
				<thead>
					<tr>
						{#each Object.keys(queryData[0]) as column}
							<th class="border border-gray-300 py-2 px-4 bg-gray-200">{column}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each queryData as row}
						<tr>
							{#each Object.entries(row) as [key, value]}
								<td class="border border-gray-300 py-2 px-4"
									>{key === 'time' ? formatTime(value) : value}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
