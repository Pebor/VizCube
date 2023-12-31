<script>
	import { Line } from 'svelte-chartjs';
	import { formatTime } from './../utils.js';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import zoomPlugin from 'chartjs-plugin-zoom';

	export let data;
	export let avg5;
	export let avg12;
	export let avg50;
	export let avg100;
	export let avg1000;
	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		zoomPlugin
	);
</script>

<div style="width: 70vw;">
	<Line
		options={{
			responsive: true,
			maintainAspectRatio: false,
			aspectRatio: 0.6, // Adjust this value to make the chart smaller or larger
			plugins: {
				tooltip: { enabled: false },
				zoom: {
					zoom: {
						wheel: {
							enabled: true
						},
						pinch: {
							enabled: true
						},
						mode: 'xy'
					}
				}
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
