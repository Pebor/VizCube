<script>
	import Modal from './../components/Modal.svelte';
	import ImportFile from './../components/ImportFile.svelte';
	import Advanced from './../components/Advanced.svelte';
	import { db } from './../store.js';
	import { query, querySimpleArray } from './../database.js';
	import { formatTime } from './../utils.js';
	import averageWorker from './../calculateAverageWorker.js?worker';
	import DateRangePicker from '../components/DateRangePicker.svelte';
	import {
		currentTimes,
		currentTimesDNFs,
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
		currentBestTime: { time: 0, date: '' },
		currentBestTimeQuery: [],
		currentSolveCount: 0,
		currentBestAvg5: { time: 0, date: '' }
	};

	let showCatMore = false;

	async function handleFileChange() {
		loading = true;
		// Create an index on the puzzle, category, and date columns
		$db.exec('CREATE INDEX idx_twisty ON twisty (puzzle, category, date);');

		let tempPuzzleOptions = querySimpleArray('Select distinct puzzle from twisty;');
		tempPuzzleOptions = tempPuzzleOptions.filter((value) => value !== '');
		puzzleOptions.set(tempPuzzleOptions.sort());
		puzzle.set($puzzleOptions[0]);

		for (let i = 0; i < $puzzleOptions.length; i++) {
			let tmpCategoryOptions = querySimpleArray(
				`Select distinct category from twisty where puzzle is '${$puzzleOptions[i]}';`
			);
			categoryOptions.set(tmpCategoryOptions.filter((value) => value !== ''));
			for (let j = 0; j < $categoryOptions.length; j++) {
				let current_data = query(
					`SELECT time, date, penalty FROM twisty where puzzle is '${$puzzleOptions[i]}' and category is '${$categoryOptions[j]}';`
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
						const updateQuery = `UPDATE twisty SET avg5 = ?, avg12 = ?, avg50 = ?, avg100 = ?, avg1000 = ?, timePb = ?, avg5Pb = ?, avg12Pb = ?, avg50Pb = ?, avg100Pb = ?, avg1000Pb = ? where puzzle is '${p}' and category is '${c}' and date is ?;`;
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

		const entries = querySimpleArray('SELECT date FROM twisty order by date');
		let longestSession = [];
		let longestSessionTime = 0;
		let currentSession = [];
		let currentSessionStart = null;
		let previousDate = null;

		entries.forEach((entry) => {
			const currentDate = new Date(entry);

			if (previousDate && currentDate - previousDate > 3600000) {
				// More than 1 hour has passed since the last entry, start a new session
				if (currentSession.length > longestSession.length) {
					longestSession = currentSession;
				}

				currentSession = [entry];
			} else {
				// Less than 1 hour has passed since the last entry, continue the current session
				currentSession.push(entry);
			}

			previousDate = currentDate;
		});

		// Check if the last session is the longest one
		if (currentSession.length > longestSession.length) {
			longestSession = currentSession;
		}

		console.log(
			`Longest session has ${longestSession.length} entries and lasted ${formatTime(
				Date.parse(longestSession[longestSession.length - 1]) - Date.parse(longestSession[0])
			)} from ${longestSession[0]} to ${longestSession[longestSession.length - 1]}`
		);

		changePuzzle();

		db_loaded = true;
	}

	function changePuzzle() {
		let tmpCategoryOptions = querySimpleArray(
			`Select distinct category from twisty where puzzle is '${$puzzle}';`
		);
		categoryOptions.set(tmpCategoryOptions.filter((value) => value !== ''));
		category.set($categoryOptions[0]);
		selectedCategories = $categoryOptions.map((cat) => ({
			category: cat,
			enabled: cat === $category
		}));
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
		startDate = querySimpleArray(
			`select min(date) from twisty where puzzle is '${$puzzle}' and ${$categoryQuery}`
		)[0].split(' ')[0];
		endDate = querySimpleArray(
			`select max(date) from twisty where puzzle is '${$puzzle}' and ${$categoryQuery}`
		)[0].split(' ')[0];

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

		if ($mainChart) {$mainChart.resetZoom();};

		stats.currentSolveCount = $currentTimes.length;

		stats.currentTimeSpend = querySimpleArray(
			`select sum(time) from twisty where puzzle is '${$puzzle}' and ${$categoryQuery} and ${$dateQuery} and penalty is not 2`
		)[0];

		stats.currentBestTime = query(
			`select min(time) 'time', date from twisty where puzzle is '${$puzzle}' and ${$categoryQuery} and ${$dateQuery} and penalty is not 2`
		)[0];
		stats.currentBestTimeQuery = query(`select time, date, scramble, penalty, comment from twisty where puzzle is '${$puzzle}' and ${$categoryQuery} and ${$dateQuery} and penalty is not 2 and timePb is 1 order by date desc limit 5`);
	}
</script>

<main class="w-full">
	{#if db_loaded}
		<div class="navbar bg-base-100">
			<div class="flex space-x-4 navbar-start">
				<div class="items-center form-control">
					<label for="puzzlePicker" class="text-lg font-bold mb-1">Puzzle</label>
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
				</div>

				<div class="items-center form-control">
					<label for="categoryPicker" class="text-lg font-bold mb-1">Category</label>
					<select
						id="categoryPicker"
						bind:value={$category}
						selected={$category}
						on:change={() => {
							changeCategories();
						}}
						class="select select-primary"
					>
						{#each $categoryOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>
				<button type="button" class="btn btn-sm" on:click={() => (showCatMore = true)}>...</button>
				<DateRangePicker
					bind:startDate
					bind:endDate
					on:apply={() => {
						updateWithDate = true;
						updateAvgs();
					}}
				/>
			</div>

			<div class="navbar-end">
				<ImportFile on:done={handleFileChange} />
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

		<StatsWidget bind:stats={stats} {updateAvgs} />

		<div>
			<button
				on:click={() => {
					advanced = !advanced;
				}}
				class="btn btn-info"
			>
				{#if advanced}
					Hide
				{:else}
					Debug
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
