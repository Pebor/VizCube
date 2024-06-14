<script>
	import { onMount } from 'svelte';
	import 'chartjs-adapter-date-fns';
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
	import { matrixData } from './../store.js';
	import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

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
		TimeScale,
		MatrixController,
		MatrixElement
	);

	export let maxCount;

	$: backgroundColor = $matrixData.map((item) => {
		const value = item.v;
		const alpha = value / maxCount;
		const adjustedAlpha = Math.pow(alpha, 0.8); // Adjust alpha value
		//${Math.floor(169 * (1 - adjustedAlpha))}
		const rgbaColor = `rgba(0, 169, 110, ${adjustedAlpha})`;
		return rgbaColor;
	});

	let weeksBetween = 0;
	$: if ($matrixData.length > 0) {
		const firstDate = new Date($matrixData[0].d);
		const lastDate = new Date($matrixData[$matrixData.length - 1].d);
		const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
		const timeDifference = Math.abs(lastDate - firstDate);
		weeksBetween = Math.ceil(timeDifference / millisecondsPerWeek);
		weeksBetween = Math.max(weeksBetween, 40);
	}

	const scales = {
		y: {
			type: 'time',
			offset: true,
			time: {
				unit: 'day',
				round: 'day',
				isoWeekday: 1,
				parser: 'i',
				displayFormats: {
					day: 'iiiiii'
				}
			},
			reverse: true,
			position: 'right',
			ticks: {
				maxRotation: 0,
				autoSkip: false,
				padding: 1,
				font: {
					size: 9
				}
			},
			grid: {
				display: false,
				drawBorder: false,
				tickLength: 0
			}
		},
		x: {
			type: 'time',
			position: 'bottom',
			offset: true,
			time: {
				unit: 'week',
				round: 'week',
				isoWeekday: 1,
				displayFormats: {
					week: 'MMM dd'
				}
			},
			ticks: {
				maxRotation: 0,
				autoSkip: false,
				font: {
					size: 9
				}
			},
			grid: {
				display: false,
				drawBorder: false,
				tickLength: 0
			}
		}
	};

	const options = {
		aspectRatio: 5,
		responsive: true,
		animations: false,
		plugins: {
			legend: false,
			tooltip: {
				displayColors: false,
				callbacks: {
					title() {
						return '';
					},
					label(context) {
						const v = context.dataset.data[context.dataIndex];
						return ['d: ' + v.d, 'Solves: ' + v.v];
					}
				}
			}
		},
		scales: scales
	};

	$: data = {
		datasets: [
			{
				label: 'My Matrix',
				data: $matrixData,
				backgroundColor: backgroundColor,
				borderWidth: 1,
				hoverBackgroundColor: '#00A96E',
				hoverBorderColor: '#006238',
				width(c) {
					const a = c.chart.chartArea || {};
					return (a.right - a.left) / weeksBetween - 2;
				},
				height(c) {
					const a = c.chart.chartArea || {};
					return (a.bottom - a.top) / 7 - 1;
				}
			}
		]
	};

	let chart;

	onMount(() => {
		chart = new ChartJS('matrix-chart', {
			type: 'matrix',
			data: data,
			options: options
		});

		window.addEventListener('resize', handleResize);
	});

	$: if (chart) {
		chart.data = data;
		chart.update();
	}

	function handleResize() {
		if (chart) {
			chart.resize();
		}
	}

	onMount(() => {});
</script>

<div class="p-2 md:p-8 rounded-box border-primary shadow-lg relative w-full">
	<canvas id="matrix-chart"></canvas>
</div>

<style>
</style>
