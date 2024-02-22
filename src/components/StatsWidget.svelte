<script>
	import { query } from '../database.js';
	import { formatTime } from './../utils.js';
	import LineChartWidget from './LineChartWidget.svelte';
	import Modal from './Modal.svelte';
	import QueryTable from './QueryTable.svelte';

	export let stats;
	export let updateAvgs;

	let showPbModal = false;
</script>

<!-- Total count
		Time spent
		Best time (s pohledem na předešlé)
		Best avg (s možností změny typu avg a přehledem předešlé)
		longest session (od kdy do kdy a kolik)
		Day with the most solves (zase asi nastavitelné na den, hour, week, month)
		Den v týdnu kdy nejvíce skládáš -->
<div class="flex flex-col gap-2 mx-8">
	<div class="flex flex-row gap-2 w-full">
		<LineChartWidget {updateAvgs} />

		<div class="stats stats-vertical shadow-lg overflow-visible">
			<div class="stat place-items-center">
				<div class="stat-title">Total solves</div>
				<div class="stat-value">{stats.currentSolveCount}</div>
			</div>

			<div class="stat place-items-center">
				<div class="stat-title">Total time solving</div>
				<div class="stat-value">
					{formatTime(stats.currentTimeSpend)}
				</div>
			</div>

			<div class="stat relative place-items-center">
				<button
					class="absolute btn btn-info btn-outline btn-square h-6 w-6 min-h-2 right-3 top-3"
					on:click={() => (showPbModal = true)}>i</button
				>
				<div class="stat-title">Best time</div>
				<div class="stat-value">{formatTime(stats.currentBestTime.time)}</div>
				<div class="stat-desc">Set on {stats.currentBestTime.date}</div>
			</div>
		</div>
	</div>

	<div class="stats shadow-lg w-min">
		<div class="stat">
			<div class="stat-title">Total solves</div>
			<div class="stat-value">{stats.currentSolveCount}</div>
		</div>

		<div class="stat">
			<div class="stat-title">Total time solving</div>
			<div class="stat-value">
				{formatTime(stats.currentTimeSpend)}
			</div>
		</div>

		<div class="stat">
			<div class="stat-title">Best time</div>
			<div class="stat-value">{formatTime(stats.currentBestTime.time)}</div>
			<div class="stat-desc">Set on {stats.currentBestTime.date}</div>
		</div>
	</div>
</div>

<Modal bind:showModal={showPbModal}>
	<h1 class="text-2xl mb-2 font-bold">Last 5 PBs</h1>
	<QueryTable queryData={stats.currentBestTimeQuery} />
</Modal>
