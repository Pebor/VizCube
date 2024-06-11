<script>
	import { formatTable } from './../utils.js';

	export let queryData = [];
</script>

<table class="table table-zebra w-full">
	{#if queryData.length === 0}
		<tr>
			<td>No data..</td>
		</tr>
	{:else}
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
						<td>{formatTable(key, value)}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	{/if}
</table>
