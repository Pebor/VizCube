<script>
	import { puzzle, longestSession } from '../store.js';
	import { formatTime, formatHour } from './../utils.js';
	import LineChartWidget from './LineChartWidget.svelte';
	import MatrixChart from './MatrixChart.svelte';
	import Modal from './Modal.svelte';
	import QueryTable from './QueryTable.svelte';

	export let stats;
	export let updateAvgs;
	export let maxCount;

	let showPbModal = false;
	let showWeekDayModal = false;
	let showBestHourModal = false;
	let showMostInDayModal = false;
	const daysOfWeek = [
		'Sundays',
		'Mondays',
		'Tuesdays',
		'Wednesdays',
		'Thursdays',
		'Fridays',
		'Saturdays'
	];
</script>

<!-- Total count
		Best avg (s možností změny typu avg a přehledem předešlé)
		longest session (od kdy do kdy a kolik)
		Day with the most solves (zase asi nastavitelné na den, hour, week, month)
		Den v týdnu kdy nejvíce skládáš -->
<div class="flex flex-col gap-2 mx-2 lg:mx-16">
	<!--  Stats needs rework, off of daisyui -->
	<div class="grid grid-cols-4 gap-2 mx-auto">
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
				class="absolute btn btn-info btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showPbModal = true)}>i</button
			>
			<div class="stat-title">{$puzzle === 'ALL' ? 'Latest PB' : 'Best time'}</div>
			<div class="stat-value">{formatTime(stats.currentBestTime.time)}</div>
			<div class="stat-desc">Set on {stats.currentBestTime.date}</div>
		</div>

		<div class="stat shadow-lg place-items-center relative">
			<div class="stat-title">Your best days</div>
			<div class="stat-value">{daysOfWeek[stats.bestWeekDay.day]}</div>
			<div class="stat-desc">With an average of {Math.floor(stats.bestWeekDay.avg)} solves</div>
			<button
				class="absolute btn btn-info btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showWeekDayModal = true)}>i</button
			>
		</div>

		<div class="stat shadow-lg place-items-center relative">
			<div class="stat-title">Your best hours</div>
			<div class="stat-value">{formatHour(stats.bestHour.hour)}</div>
			<div class="stat-desc">With an average of {Math.floor(stats.bestHour.avg)} solves</div>
			<button
				class="absolute btn btn-info btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
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
				class="absolute btn btn-info btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
				on:click={() => (showMostInDayModal = true)}>i</button
			>
		</div>
	</div>
	{#if $puzzle !== 'ALL'}
		<LineChartWidget {updateAvgs} />
	{/if}
	<MatrixChart {maxCount} />
</div>

<Modal bind:showModal={showPbModal}>
	<h1 class="text-2xl mb-2 font-bold">Last 5 PBs</h1>
	<QueryTable queryData={stats.currentBestTime.query} />
</Modal>

<Modal bind:showModal={showWeekDayModal}>
	<h1 class="text-2xl mb-2 font-bold">Week days</h1>
	<QueryTable queryData={stats.bestWeekDay.query} />
</Modal>

<Modal bind:showModal={showBestHourModal}>
	<h1 class="text-2xl mb-2 font-bold">Hours of the day</h1>
	<QueryTable queryData={stats.bestHour.query} />
</Modal>

<Modal bind:showModal={showMostInDayModal}>
	<h1 class="text-2xl mb-2 font-bold">Most "productive" days</h1>
	<QueryTable queryData={stats.mostInDay.query} />
</Modal>