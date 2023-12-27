<script>
	import { Line } from 'svelte-chartjs';
	import 'chart.js/auto';
	import 'chartjs-adapter-date-fns';

	export let data;
	export let avg5;
	export let avg12;
	export let avg50;
	export let avg100;
	export let avg1000;

	function formatTime(milliseconds) {
		var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
		var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
		var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds

		var timeString = '';
		if (hours > 0) {
			timeString += hours.toString() + 'h ';
		}
		if (minutes > 0) {
			timeString += minutes.toString() + 'm ';
		}
		timeString += seconds.toString().padStart(2, '0') + 's';

		return timeString;
	}
</script>

<div style="width: 70vw;">
	<Line
		options={{
			responsive: true,
			maintainAspectRatio: false,
			aspectRatio: 0.6, // Adjust this value to make the chart smaller or larger
			plugins: {
				tooltip: { enabled: false }
			},
			scales: {
				x: {
					type: 'linear',
					position: 'bottom'
				},
				y: {
					beginAtZero: true,
					seggestedMin: 5,
					ticks: {
						callback: function (value, index, values) {
							return formatTime(value);
						}
					}
				}
			},
			parsing: {
				yAxisKey: 'time'
			},
			elements: {
				point: {
					radius: 0
				},
				line: {
					borderWidth: 2 // Increase the border width by 1 pixel
				}
			}
		}}
		data={{
			datasets: [
				{ data: avg1000, label: 'Ao1000' },
				{ data: avg100, label: 'Ao100' },
				{ data: avg50, label: 'Ao50' },
				{ data: avg12, label: 'Ao12' },
				{ data: avg5, label: 'Ao5' },
				{ data: data, label: 'Time' }
			]
		}}
	/>
</div>
