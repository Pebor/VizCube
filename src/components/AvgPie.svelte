<script>
	import { Doughnut } from 'svelte-chartjs';
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

	let solvePercentages;
	let legendOn = true;

	$: {
		let totalSolves = data.reduce((sum, item) => sum + item.solves, 0);
		solvePercentages = data.map((item) => ((item.solves / totalSolves) * 100).toFixed(2)).reverse();	
	}
</script>
<div class="p-4 md:p-8 rounded-box border-primary shadow-lg w-full flex flex-col">
	<div class="relative">
		<Doughnut
		options={{
			maintainAspectRatio: false,
			aspectRatio: 0.8,
			responsive: true,
			plugins: {
				legend: {
					display: legendOn,
					position: 'right',
					align: 'center',
					labels: {
						boxWidth: 10,
						padding: 10
					}
				},
				tooltip: {
					enabled: true,
					callbacks: {
						label: function(context) {
							let label = context.label || '';

							if (label) {
								label += ': ';
							}

							if (context.parsed) {
								label += context.parsed + '%';
							}

							return context.parsed + '%';
						}
					}
				}
			}
		}}
		data={{
			labels: data.map((item) => formatTime(item.time)).reverse(),
			datasets: [
				{
					data: solvePercentages,
					borderalign: 'center',
					borderWidth: 0
				}
			]
		}}
	/>	</div>
	<div class="flex flex-wrap mt-4">
		<label class="label cursor-pointer">
			<input type="checkbox" bind:checked={legendOn} class="checkbox" />
			<span class="label-text ml-2 font-bold">Legend</span>
		</label>
	</div>
</div>
