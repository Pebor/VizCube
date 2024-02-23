<script>
	import Modal from './../components/Modal.svelte';
	import ImportFile from './../components/ImportFile.svelte';
	import Advanced from './../components/Advanced.svelte';
	import { db, longestSession } from './../store.js';
	import { query, querySimpleArray } from './../database.js';
	import { formatTime } from './../utils.js';
	import averageWorker from './../calculateAverageWorker.js?worker';
	import DateRangePicker from '../components/DateRangePicker.svelte';
	import {
		currentTimes,
		currentTimesDNFs,
		currentTimes2s,
		currentTimesPBs,
		avgs5,
		avgs12,
		avgs50,
		avgs100,
		avgs1000,
		byDate,
		category,
		categoryOptions,
		chartDateQuery,
		currentEndDate,
		currentStartDate,
		puzzle,
		puzzleOptions,
		categoryQuery,
		dateQuery,
		generalQuery,
		calculateSession,
		mainChart
	} from './../store.js';
	import StatsWidget from './../components/StatsWidget.svelte';

	let startDate;
	let endDate;
	let updateWithDate = false;

	let loading = false;

	let selectedCategories = [];

	let advanced = false;
	let db_loaded = false;

	let stats = {
		currentTimeSpend: 0,
		currentBestTime: { time: 0, date: '', query: [] },
		currentSolveCount: 0,
		currentBestAvg5: { time: 0, date: '' },
		bestWeekDay: { day: '', avg: '', query: [] },
		bestHour: { hour: '', avg: '', query: [] },
		mostInDay: { date: '', solves: 0, query: [] }
	};

	let showCatMore = false;

	async function handleFileChange() {
		loading = true;
		// Create an index on the puzzle, category, and date columns
		$db.exec('CREATE INDEX idx_solutions ON solutions (puzzle, category, date);');

		let tempPuzzleOptions = querySimpleArray('Select distinct puzzle from solutions;');
		tempPuzzleOptions = tempPuzzleOptions.filter((value) => value !== '');
		puzzleOptions.set(['ALL', ...tempPuzzleOptions.sort()]);
		puzzle.set($puzzleOptions[1]);

		for (let i = 1; i < $puzzleOptions.length; i++) {
			let tmpCategoryOptions = querySimpleArray(
				`Select distinct category from solutions where puzzle is '${$puzzleOptions[i]}';`
			);
			categoryOptions.set(tmpCategoryOptions.filter((value) => value !== ''));
			for (let j = 0; j < $categoryOptions.length; j++) {
				let current_data = query(
					`SELECT time, date, penalty FROM solutions where puzzle is '${$puzzleOptions[i]}' and category is '${$categoryOptions[j]}';`
				);

				let timeValues = current_data.map((item) => item.time);
				let dateValues = current_data.map((item) => item.date);
				let penaltyValues = current_data.map((item) => item.penalty);

				let workers = [];
				let numElementsList = [5, 12, 50, 100, 1000];
				let avgs = [];
				let p = $puzzleOptions[i];
				let c = $categoryOptions[j];

				let promises = numElementsList.map((numElements, index) => {
					return new Promise((resolve, reject) => {
						workers[index] = new averageWorker();

						workers[index].onmessage = function (event) {
							avgs[index] = event.data;
							resolve();
						};

						workers[index].onerror = function (error) {
							reject(error);
						};

						workers[index].postMessage({ timeValues, numElements, penaltyValues });
					});
				});

				// calculate single pbs
				let lowest = Infinity;
				timeValues = timeValues.map((val, index) => {
					if (val < lowest && penaltyValues[index] != 2) {
						lowest = val;
						return { time: val, pb: true };
					}
					return { time: val, pb: false };
				});

				await Promise.all(promises)
					.then(() => {
						const updateQuery = `UPDATE solutions SET avg5 = ?, avg12 = ?, avg50 = ?, avg100 = ?, avg1000 = ?, timePb = ?, avg5Pb = ?, avg12Pb = ?, avg50Pb = ?, avg100Pb = ?, avg1000Pb = ? where puzzle is '${p}' and category is '${c}' and date is ?;`;
						const new_stmt = $db.prepare(updateQuery);

						let tmpAvgs5 = avgs[0];
						let tmpAvgs12 = avgs[1];
						let tmpAvgs50 = avgs[2];
						let tmpAvgs100 = avgs[3];
						let tmpAvgs1000 = avgs[4];

						// Start a transaction
						$db.run('BEGIN TRANSACTION;');

						dateValues.forEach((element, index) => {
							new_stmt.run([
								tmpAvgs5[index].avg,
								tmpAvgs12[index].avg,
								tmpAvgs50[index].avg,
								tmpAvgs100[index].avg,
								tmpAvgs1000[index].avg,
								timeValues[index].pb,
								tmpAvgs5[index].pb,
								tmpAvgs12[index].pb,
								tmpAvgs50[index].pb,
								tmpAvgs100[index].pb,
								tmpAvgs1000[index].pb,
								element
							]);
						});

						// Commit the transaction
						$db.run('COMMIT;');
						new_stmt.free();
						workers.forEach((worker) => worker.terminate());
					})
					.catch((error) => {
						// Handle any errors
						console.error(error);
					});
			}
		}

		changePuzzle();

		db_loaded = true;
	}

	function changePuzzle() {
		if ($puzzle !== 'ALL') {
			let tmpCategoryOptions = querySimpleArray(
				`Select distinct category from solutions where puzzle is '${$puzzle}';`
			);
			console.log(tmpCategoryOptions);
			categoryOptions.set(tmpCategoryOptions.filter((value) => value !== ''));
			category.set($categoryOptions[0]);
			selectedCategories = $categoryOptions.map((cat) => ({
				category: cat,
				enabled: cat === $category
			}));
		} else {
			categoryOptions.set([]);
			category.set('');
			selectedCategories = [];
		}
		updateAvgs();
	}

	function changeCategories(params) {
		selectedCategories = $categoryOptions.map((cat) => ({
			category: cat,
			enabled: cat === $category
		}));

		updateAvgs();
	}

	function selectCategories() {
		console.log('selectCategories');
		category.set(selectedCategories.filter((cat) => cat.enabled));

		updateAvgs();
	}

	function updateAvgs() {
		let tmpQuery = $puzzle === 'ALL' ? '' : `where puzzle is '${$puzzle}' and ${$categoryQuery}`;
		startDate = querySimpleArray(`select min(date) from solutions ${tmpQuery}`)[0].split(' ')[0];
		endDate = querySimpleArray(`select max(date) from solutions ${tmpQuery}`)[0].split(' ')[0];

		currentStartDate.set(updateWithDate ? $currentStartDate : startDate);
		currentEndDate.set(updateWithDate ? $currentEndDate : endDate);
		updateWithDate = false;

		currentTimes.set(
			query(`SELECT time, penalty ${$chartDateQuery}`).map((time, index) => ({
				x: $byDate ? time.date : index,
				time: time.penalty == '2' ? null : time.time
			}))
		);
		currentTimesDNFs.set(
			query(`SELECT time, penalty ${$chartDateQuery}`).map((time, index) => ({
				x: $byDate ? time.date : index,
				time: time.penalty == '2' ? time.time : null
			}))
		);
		currentTimes2s.set(
			query(`SELECT time, penalty ${$chartDateQuery}`).map((time, index) => ({
				x: $byDate ? time.date : index,
				time: time.penalty == '1' ? time.time : null
			}))
		);
		currentTimesPBs.set(
			query(`SELECT time, timePb ${$chartDateQuery}`).map((time, index) => ({
				x: $byDate ? time.date : index,
				time: time.timePb == '1' ? time.time : null
			}))
		);

		avgs5.set(
			query(`SELECT avg5 ${$chartDateQuery}`).map((avg, index) => ({
				x: $byDate ? avg.date : index,
				time: avg.avg5
			}))
		);

		avgs12.set(
			query(`SELECT avg12 ${$chartDateQuery}`).map((avg, index) => ({
				x: $byDate ? avg.date : index,
				time: avg.avg12
			}))
		);

		avgs50.set(
			query(`SELECT avg50 ${$chartDateQuery}`).map((avg, index) => ({
				x: $byDate ? avg.date : index,
				time: avg.avg50
			}))
		);

		avgs100.set(
			query(`SELECT avg100 ${$chartDateQuery}`).map((avg, index) => ({
				x: $byDate ? avg.date : index,
				time: avg.avg100
			}))
		);

		avgs1000.set(
			query(`SELECT avg1000 ${$chartDateQuery}`).map((avg, index) => ({
				x: $byDate ? avg.date : index,
				time: avg.avg1000
			}))
		);

		if ($mainChart) {
			$mainChart.resetZoom();
		}

		stats.currentSolveCount = $currentTimes.length;

		stats.currentTimeSpend = querySimpleArray(
			`select sum(time) ${$generalQuery} and penalty is not 2 order by date desc`
		)[0];

		stats.currentBestTime = query(
			`select time, date ${$generalQuery} and timePb is 1 and penalty is not 2 order by date desc`
		)[0];
		stats.currentBestTime.query = query(
			`select ${$puzzle === 'ALL' ? 'puzzle, category, ' : ''} time, date, scramble, penalty, comment ${$generalQuery} and penalty is not 2 and timePb is 1 order by date desc limit 5`
		);

		stats.bestWeekDay.day = querySimpleArray(
			`select strftime('%w', date) ${$generalQuery} group by strftime('%w', date) order by count(*) desc limit 1`
		)[0];
		stats.bestWeekDay.avg = querySimpleArray(
			`SELECT AVG(daily_counts) AS average_count_per_day
FROM (
    SELECT COUNT(*) AS daily_counts
    ${$generalQuery}
    GROUP BY strftime('%w', date) 
);`
		)[0];
		stats.bestWeekDay.query = query(
			`select strftime('%w', date) day, count(*) solves ${$generalQuery} group by strftime('%w', date) order by count(*) desc`
		);

		stats.bestHour.hour = querySimpleArray(
			`select strftime('%H', date) ${$generalQuery} group by strftime('%H', date) order by count(*) desc limit 1`
		)[0];
		stats.bestHour.avg = querySimpleArray(
			`SELECT AVG(hourly_counts) AS average_count_per_hour 
FROM (
	SELECT COUNT(*) AS hourly_counts
	${$generalQuery}
	GROUP BY strftime('%H', date)
);`
		)[0];
		stats.bestHour.query = query(
			`select strftime('%H', date) hour, count(*) solves ${$generalQuery} group by strftime('%H', date) order by count(*) desc`
		);

		stats.mostInDay = query(
			`select strftime('%F', date) as 'date', count(*) solves ${$generalQuery} group by strftime('%F', date) order by count(*) desc limit 1`
		)[0];
		stats.mostInDay.query = query(
			`select strftime('%F', date) as 'date', count(*) solves ${$generalQuery} group by strftime('%F', date) order by count(*) desc limit 5`
		);

		calculateSession($generalQuery, longestSession);
	}
</script>

<main class="w-full">
	{#if db_loaded}
		<div class="bg-base-100 mx-8 mt-2 mb-4 px-4 py-4 border-b-2 border-neutral">
			<div class="flex relative">
				<div class="flex grow-0 w-max space-x-4 items-center">
					<div class="items-center form-control">
						<label for="puzzlePicker" class="label">
							<span class="label-text text-lg font-bold mr-2">Puzzle</span>
							<select
							id="puzzlePicker"
							bind:value={$puzzle}
							selected={$puzzle}
							on:change={() => {
								changePuzzle();
							}}
							class="select select-primary"
						>
							{#each $puzzleOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
						</label>
					</div>

					<div class="items-center form-control">
						<label for="puzzlePicker" class="label">
							<span class="label-text text-lg font-bold mr-2">Category</span>
							<select
								id="categoryPicker"
								bind:value={$category}
								selected={$category}
								on:change={() => {
									changeCategories();
								}}
								class="select select-primary"
								disabled={$puzzle === 'ALL'}
							>
								{#each $categoryOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
						</label>
					</div>

					<button
						type="button"
						class="btn btn-sm"
						on:click={() => (showCatMore = true)}
						disabled={$puzzle === 'ALL'}>...</button
					>
				</div>

				<DateRangePicker
					bind:startDate
					bind:endDate
					on:apply={() => {
						updateWithDate = true;
						updateAvgs();
					}}
				/>
			</div>
		</div>

		<Modal bind:showModal={showCatMore} done={true} on:clickDone={() => selectCategories()}>
			<h1 class="text-xl mb-8 text-neutral-content font-bold">Select categories</h1>

			{#each selectedCategories as { category, enabled }}
				<div class="flex">
					<label class="label cursor-pointer">
						<input type="checkbox" id={category} bind:checked={enabled} class="checkbox mr-2" />
						<span class="label-text">{category}</span>
					</label>
				</div>
			{/each}
		</Modal>

		<StatsWidget bind:stats {updateAvgs} />

		<div>
			<button
				on:click={() => {
					advanced = !advanced;
				}}
				class="btn btn-info ml-16 my-8"
			>
				{#if advanced}
					Hide
				{:else}
					Advanced
				{/if}
			</button>
		</div>

		{#if advanced}
			<Advanced />
		{/if}
	{:else}
		<div class="center">
			{#if loading && !db_loaded}
				<span class="loading loading-dots"></span>
			{:else}
				<ImportFile on:done={handleFileChange} />
			{/if}
		</div>
	{/if}
</main>

<style>
	/* Center the input */
	.center {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
	}
</style>
