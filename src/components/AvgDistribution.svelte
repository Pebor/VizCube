<script>
	import { Bar } from 'svelte-chartjs';
	import { Chart } from 'chart.js/auto';

	export let data;

	function formatTime(milliseconds) {
		var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
		var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
		var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds

		var timeString = '';

		timeString += hours > 0 ? hours.toString() + 'h ' : '';
		timeString += minutes > 0 ? minutes.toString() + 'm ' : '';

		timeString += hours === 0 ? ' ' + seconds.toString().padStart(2, '0') + 's' : '';

		return timeString;
	}
</script>

<div class="p-2 md:p-8 rounded-box border-primary shadow-lg relative w-full">
	<Bar
		options={{
			maintainAspectRatio: false,
			aspectRatio: 1,
			responsive: true,
			tension: 0.3,
			plugins: {
				legend: false
			}
		}}
		data={{
			labels: data.map((item) => formatTime(item.time)),
			datasets: [
				{
					data: data.map((item) => item.solves),
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1
				}
			]
		}}
	/>
</div>
