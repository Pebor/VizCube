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
		LineController,
		PointElement,
		Colors,
		CategoryScale,
		TimeScale
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import { Parser } from 'papaparse';

	export let data;
	export let avg5;
	export let avg12;
	export let avg50;
	export let avg100;
	export let avg1000;
	export let chart;

	export let byDate;

	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		LineController,
		PointElement,
		CategoryScale,
		Colors,
		zoomPlugin,
		TimeScale
	);
</script>

<div style="width: 70vw;" class="m-auto my-8 p-8 rounded-box border-primary shadow-lg">
	<Line
		bind:chart
		options={{
			        elements: {
            point: {
                radius: 0 // default to disabled in all datasets
            }
        },
			responsive: true,
			maintainAspectRatio: false,
			aspectRatio: 0.6, // Adjust this value to make the chart smaller or larger
			normalized: true,
			animation: data.length > 5000 ? false : true,
			plugins: {
				zoom: {
					zoom: {
						drag: {
							enabled: true
						},
						mode: 'x'
					},
					limits: {
						x: { min: 0 },
						y: { min: 0 }
					}
				},
				tooltip: {
					callbacks: {
						label: function (context) {
							return formatTime(context.parsed.y);
						}
					}
				}
			},
			scales: {
				x: {
					type: byDate ? 'time' : 'linear',
					position: 'bottom',
					min: byDate ? data[0].date : 0,
					max: byDate ? data[data.length-1].date : data.length,
					time: byDate ? {
						parser: 'yyyy-MM-dd HH:mm:ss',
					} : undefined
				},
				y: {
					seggestedMin: 0,
					ticks: {
						callback: function (value, index, values) {
							return formatTime(value);
						},
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
					borderWidth: 2,
					spanGaps: true
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
				{ data: data, label: 'Time', borderWidth: 1}
			]
		}}
	/>
</div>
