<script>
	import { puzzle, longestSession } from '../store.js';
	import { formatTime, formatHour } from './../utils.js';
	import DistributionGraph from './DistributionGraph.svelte';
	import AvgDistribution from './AvgDistribution.svelte';
	import LineChartWidget from './LineChartWidget.svelte';
	import MatrixChart from './MatrixChart.svelte';
	import Modal from './Modal.svelte';
	import QueryTable from './QueryTable.svelte';
	import { formatTable } from '../utils';

	export let stats;
	export let updateAvgs;
	export let maxCount;

	let showPbModal = false;
	let showWeekDayModal = false;
	let showBestHourModal = false;
	let showMostInDayModal = false;

	let bestWeekDayDistribution = [];
	let bestHourDistribution = [];
	let mostInDayDistribution = [];

	$: {
		bestWeekDayDistribution = JSON.parse(JSON.stringify(stats.bestWeekDay.query));
		bestWeekDayDistribution = bestWeekDayDistribution.sort((a, b) => a.day - b.day);
		bestWeekDayDistribution = bestWeekDayDistribution.map((item) => ({
			x: formatTable('shortDay', item.day),
			y: item.solves
		}));

		bestHourDistribution = JSON.parse(JSON.stringify(stats.bestHour.query));
		bestHourDistribution = bestHourDistribution.sort((a, b) => a.hour - b.hour);
		bestHourDistribution = bestHourDistribution.map((item) => ({
			x: formatTable('hour', item.hour),
			y: item.solves
		}));

		mostInDayDistribution = JSON.parse(JSON.stringify(stats.mostInDay.query));
		mostInDayDistribution = mostInDayDistribution.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateA - dateB;
		});
		mostInDayDistribution = mostInDayDistribution.map((item) => ({ x: item.date, y: item.solves }));
	}
</script>

<!-- Total count
		Best avg (s možností změny typu avg a přehledem předešlé)
		longest session (od kdy do kdy a kolik)
		Day with the most solves (zase asi nastavitelné na den, hour, week, month)
		Den v týdnu kdy nejvíce skládáš -->
<div class="flex flex-col gap-2 px-2 lg:px-16 w-full">
	<!--  Stats needs rework, off of daisyui -->
	<div class="flex flex-wrap md:grid grid-cols-4 gap-2 px-4 w-full">
		<div class="stat place-items-center shadow-lg">
			<div class="stat-title">Total solves</div>
			<div class="stat-value">{stats.currentSolveCount}</div>
		</div>

		<div class="stat place-items-center shadow-lg col-span-2">
			<div class="stat-title">Total time solving</div>
			<div class="stat-value">
				{formatTime(stats.currentTimeSpend)}
			</div>
		</div>

		<div class="stat place-items-center shadow-lg relative">
			<button
				class="absolute btn btn-accent btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showPbModal = true)}>i</button
			>
			<div class="stat-title">{$puzzle === 'ALL' ? 'Latest PB' : 'Best time'}</div>
			<div class="stat-value">
				{stats.currentBestTime.time ? formatTime(stats.currentBestTime.time) : 'No overall PB'}
			</div>
			<div class="stat-desc">Set on {stats.currentBestTime.date}</div>
		</div>

		<div class="stat shadow-lg place-items-center relative">
			<div class="stat-title">Your best days</div>
			<div class="stat-value">{formatTable('day', stats.bestWeekDay.day)}</div>
			<div class="stat-desc">With an average of {Math.floor(stats.bestWeekDay.avg)} solves</div>
			<button
				class="absolute btn btn-accent btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showWeekDayModal = true)}>i</button
			>
		</div>

		<div class="stat shadow-lg place-items-center relative">
			<div class="stat-title">Your best hours</div>
			<div class="stat-value">{formatHour(stats.bestHour.hour)}</div>
			<div class="stat-desc">With an average of {Math.floor(stats.bestHour.avg)} solves</div>
			<button
				class="absolute btn btn-accent btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showBestHourModal = true)}>i</button
			>
		</div>

		<div class="stat shadow-lg place-items-center">
			<div class="stat-title">Longest session</div>
			<div class="stat-value">{$longestSession.time}</div>
			<div class="stat-desc">from {$longestSession.start} to {$longestSession.end}</div>
			<div class="stat-desc">over {$longestSession.length} solves</div>
		</div>

		<div class="stat shadow-lg place-items-center relative">
			<div class="stat-title">Most in one day</div>
			<div class="stat-value">{stats.mostInDay.solves}</div>
			<div class="stat-desc">On {stats.mostInDay.date}</div>
			<button
				class="absolute btn btn-accent btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showMostInDayModal = true)}>i</button
			>
		</div>
	</div>
	{#if $puzzle !== 'ALL'}
		<LineChartWidget {updateAvgs} />
		<AvgDistribution bind:data={stats.timeDistribution} />
	{/if}
	<MatrixChart {maxCount} />
</div>

<Modal bind:showModal={showPbModal}>
	<h1 class="text-2xl mb-2 font-bold">Last 5 PBs</h1>
	<QueryTable queryData={stats.currentBestTime.query} />
</Modal>

<Modal bind:showModal={showWeekDayModal}>
	<h1 class="text-2xl mb-2 font-bold">Week days</h1>
	<div class="space-y-2">
		<QueryTable queryData={stats.bestWeekDay.query} />
		<DistributionGraph bind:data={bestWeekDayDistribution} />
	</div>
</Modal>

<Modal bind:showModal={showBestHourModal}>
	<h1 class="text-2xl mb-2 font-bold">Hours of the day</h1>
	<div class="space-y-2">
		<QueryTable queryData={stats.bestHour.query} />
		<DistributionGraph bind:data={bestHourDistribution} />
	</div>
</Modal>

<Modal bind:showModal={showMostInDayModal}>
	<h1 class="text-2xl mb-2 font-bold">Most "productive" days</h1>
	<div class="space-y-2">
		<QueryTable queryData={stats.mostInDay.query} />
		<DistributionGraph bind:data={mostInDayDistribution} />
	</div>
</Modal>
