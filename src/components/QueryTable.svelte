<script>
	import { formatTime, formatHour } from './../utils.js';

	export let queryData = [];

	const formatableKey = ['time', 'avg5', 'avg12', 'avg50', 'avg100', 'avg1000'];
	const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	function format(key, value) {
		if (formatableKey.includes(key) && value != null) {
			return formatTime(value);
		} else if (key === 'day') {
			return daysOfWeek[value];
		} else if (key === 'hour') {
			return formatHour(value);
		} else if (key === 'penalty') {
			if (value == 1) {
				return '+2';
			} else if (value == 2) {
				return 'DNF';
			} else {
				return '';
			}
		} else if (value == null || value === 0)
            return '';
        else {
			return value;
		}
	}
</script>

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
					<td>{format(key, value)}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
