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
	import { currentTimes, currentTimesDNFs, avgs5, avgs12, avgs50, avgs100, avgs1000, byDate, mainChart } from './../store.js';

	export let spanGaps;
	export let points;
	export let pointsSize;

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

<div style="width: 70vw;">
	<Line
		bind:chart={$mainChart}
		options={{
			responsive: true,
			maintainAspectRatio: false,
			aspectRatio: 0.6, // Adjust this value to make the chart smaller or larger
			normalized: true,
			animation: $currentTimes.length > 5000 ? false : true,
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
					type: $byDate ? 'time' : 'linear',
					position: 'bottom',
					min: $byDate ? $currentTimes[0].date : 0,
					max: $byDate ? $currentTimes[$currentTimes.length-1].date : $currentTimes.length,
					time: $byDate ? {
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
			datasets: {
				line: {
					borderWidth: 2,
					spanGaps: spanGaps
				}
			},
			elements: {
				point: {
					radius: points ? pointsSize : 0
				}
			}
		}}
		data={{
			datasets: [
				{ data: $avgs1000, label: 'Ao1000' },
				{ data: $avgs100, label: 'Ao100' },
				{ data: $avgs50, label: 'Ao50' },
				{ data: $avgs12, label: 'Ao12' },
				{ data: $avgs5, label: 'Ao5' },
				{ data: $currentTimes, label: 'Time', borderWidth: 1},
				{ data: $currentTimesDNFs, label: 'DNF', borderWidth: 0, pointRadius: 3, pointStyle: 'rect'},

			]
		}}
	/>
</div>
