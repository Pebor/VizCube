<script>
	import Modal from './../components/Modal.svelte';
	import ImportFile from './../components/ImportFile.svelte';
	import Advanced from './../components/Advanced.svelte';
	import LineChartBasic from './../components/LineChartBasic.svelte';
	import initSqlJs from 'sql.js';
	import Papa from 'papaparse';
	import { db } from './../store.js';
	import { query, querySimpleArray } from './../database.js';
	import { formatTime } from './../utils.js';
	import averageWorker from './../calculateAverageWorker.js?worker';
	import DateRangePicker from '../components/DateRangePicker.svelte';

	let startDate;
	let endDate;
	let currentStartDate;
	let currentEndDate;
	let updateWithDate = false;

	let file;
	let loading = false;

	let puzzle, category;

	let puzzleOptions = [];
	let categoryOptions = [];
	let categorySelected = [];
	let categorySelectedOptions = [];
	let isCategorySelection = false;

	let advanced = false;
	let db_loaded = false;

	let current_times;
	let avgs5;
	let avgs12;
	let avgs50;
	let avgs100;
	let avgs1000;
	let currentTimeSpend = 0;
	let currentSolveCount = 0;
	let currentBestTime;
	let currentBestAvg5;

	let mainChart;
	let byDate;

	let showCatMore = false;

	async function handleFileChange() {
		loading = true;
		// Create an index on the puzzle, category, and date columns
		$db.exec('CREATE INDEX idx_twisty ON twisty (puzzle, category, date);');

		puzzleOptions = querySimpleArray('Select distinct puzzle from twisty;');
		puzzleOptions = puzzleOptions.filter((value) => value !== '');
		puzzleOptions.sort();
		puzzle = puzzleOptions[0];

		for (let i = 0; i < puzzleOptions.length; i++) {
			categoryOptions = querySimpleArray(
				`Select distinct category from twisty where puzzle is '${puzzleOptions[i]}';`
			);
			categoryOptions = categoryOptions.filter((value) => value !== '');
			for (let j = 0; j < categoryOptions.length; j++) {
				let current_data = query(
					`SELECT time, date FROM twisty where puzzle is '${puzzleOptions[i]}' and category is '${categoryOptions[j]}';`
				);

				let timeValues = current_data.map((item) => item.time);
				let dateValues = current_data.map((item) => item.date);

				let workers = [];
				let numElementsList = [5, 12, 50, 100, 1000];
				let avgs = [];
				let p = puzzleOptions[i];
				let c = categoryOptions[j];

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

						workers[index].postMessage({ timeValues, numElements });
					});
				});

				let lowest = Infinity;
				timeValues = timeValues.map((val) => {
					if (val < lowest) {
						lowest = val;
						return { time: val, pb: true };
					}
					return { time: val, pb: false };
				});

				await Promise.all(promises)
					.then(() => {
						const updateQuery = `UPDATE twisty SET avg5 = ?, avg12 = ?, avg50 = ?, avg100 = ?, avg1000 = ?, timePb = ?, avg5Pb = ?, avg12Pb = ?, avg50Pb = ?, avg100Pb = ?, avg1000Pb = ? where puzzle is '${p}' and category is '${c}' and date is ?;`;
						const new_stmt = $db.prepare(updateQuery);

						avgs5 = avgs[0];
						avgs12 = avgs[1];
						avgs50 = avgs[2];
						avgs100 = avgs[3];
						avgs1000 = avgs[4];

						// Start a transaction
						$db.run('BEGIN TRANSACTION;');

						dateValues.forEach((element, index) => {
							new_stmt.run([
								avgs5[index].avg,
								avgs12[index].avg,
								avgs50[index].avg,
								avgs100[index].avg,
								avgs1000[index].avg,
								timeValues[index].pb,
								avgs5[index].pb,
								avgs12[index].pb,
								avgs50[index].pb,
								avgs100[index].pb,
								avgs1000[index].pb,
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
		categoryOptions = querySimpleArray(
			`Select distinct category from twisty where puzzle is '${puzzle}';`
		);
		categoryOptions = categoryOptions.filter((value) => value !== '');
		category = categoryOptions[0];
		isCategorySelection = false;

		categorySelectedOptions = categoryOptions.map((cat) => ({
			category: cat,
			enabled: cat === category
		}));

		updateAvgs();
	}

	function changeCategories(params) {
		isCategorySelection = false;

		categorySelectedOptions = categoryOptions.map((cat) => ({
			category: cat,
			enabled: cat === category
		}));

		updateAvgs();
	}

	function selectCategories() {
		isCategorySelection = true;
		categorySelected = categorySelectedOptions.filter((cat) => cat.enabled);
		updateAvgs();
	}

	function updateAvgs() {
		let selected = categorySelectedOptions.filter((cat) => cat.enabled);
		selected = selected.map((cat) => "'" + cat.category + "'");

		let categoryQuery = isCategorySelection
			? `category IN (${selected.join(',')})`
			: `category is '${category}'`;

		startDate = querySimpleArray(
			`select min(date) from twisty where puzzle is '${puzzle}' and ${categoryQuery}`
		)[0].split(' ')[0];
		endDate = querySimpleArray(
			`select max(date) from twisty where puzzle is '${puzzle}' and ${categoryQuery}`
		)[0].split(' ')[0];

		currentStartDate = updateWithDate ? currentStartDate : startDate;
		currentEndDate = updateWithDate ? currentEndDate : endDate;
		updateWithDate = false;

		let dateQuery = `strftime('%F', date)  >= '${currentStartDate}' and strftime('%F', date)  <= '${currentEndDate}'`;
		let generalQuery = `FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} and ${dateQuery} ORDER BY date`;
		let chartDateQuery = `${byDate ? `, date` : ``} ${generalQuery}`;

		current_times = query(`SELECT time ${chartDateQuery}`).map((time, index) => ({
			x: byDate ? time.date : index,
			time: time.time
		}));

		avgs5 = query(`SELECT avg5 ${chartDateQuery}`).map((avg, index) => ({
			x: byDate ? avg.date : index,
			time: avg.avg5
		}));

		avgs12 = query(`SELECT avg12 ${chartDateQuery}`).map((avg, index) => ({
			x: byDate ? avg.date : index,
			time: avg.avg12
		}));

		avgs50 = query(`SELECT avg50 ${chartDateQuery}`).map((avg, index) => ({
			x: byDate ? avg.date : index,
			time: avg.avg50
		}));

		avgs100 = query(`SELECT avg100 ${chartDateQuery}`).map((avg, index) => ({
			x: byDate ? avg.date : index,
			time: avg.avg100
		}));

		avgs1000 = query(`SELECT avg1000 ${chartDateQuery}`).map((avg, index) => ({
			x: byDate ? avg.date : index,
			time: avg.avg1000
		}));

		if (mainChart) resetMainChart();

		currentSolveCount = current_times.length;

		currentTimeSpend = querySimpleArray(
			`select sum(time) from twisty where puzzle is '${puzzle}' and ${categoryQuery} and ${dateQuery}`
		)[0];

		currentBestTime = query(
			`select min(time) 'time', date from twisty where puzzle is '${puzzle}' and ${categoryQuery} and ${dateQuery}`
		)[0];
	}

	function resetMainChart() {
		mainChart.resetZoom();
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
						bind:value={puzzle}
						selected={puzzle}
						on:change={() => {
							changePuzzle();
						}}
						class="select select-primary"
					>
						{#each puzzleOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>

				<div class="items-center form-control">
					<label for="categoryPicker" class="text-lg font-bold mb-1">Category</label>
					<select
						id="categoryPicker"
						bind:value={category}
						selected={category}
						on:change={() => {
							changeCategories();
						}}
						class="select select-primary"
					>
						{#each categoryOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>
				<button type="button" class="btn btn-sm" on:click={() => (showCatMore = true)}>...</button>
				<DateRangePicker
					bind:startDate
					bind:endDate
					bind:currentStartDate
					bind:currentEndDate
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

			{#each categorySelectedOptions as { category, enabled }}
				<div class="flex">
					<label class="label cursor-pointer">
						<input type="checkbox" id={category} bind:checked={enabled} class="checkbox mr-2" />
						<span class="label-text">{category}</span>
					</label>
				</div>
			{/each}
		</Modal>

		<div>
			<LineChartBasic
				bind:chart={mainChart}
				data={current_times}
				avg5={avgs5}
				avg12={avgs12}
				avg50={avgs50}
				avg100={avgs100}
				avg1000={avgs1000}
				bind:byDate
			/>
			<button on:click={() => resetMainChart()} class="btn btn-neutral"> Reset zoom </button>
			<label for="checkByDate" class="label" >by Date (gotta zoom in)</label>
			<input type="checkbox" bind:checked={byDate} class="checkbox" id="checkByDate" on:change={updateAvgs} >
		</div>

		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">Total solves</div>
				<div class="stat-value">{currentSolveCount}</div>
			</div>

			<div class="stat">
				<div class="stat-title">Total time solving</div>
				<div class="stat-value">
					{formatTime(currentTimeSpend)}
				</div>
			</div>

			<div class="stat">
				<div class="stat-title">Best time</div>
				<div class="stat-value">{formatTime(currentBestTime.time)}</div>
				<div class="stat-desc">Set on {currentBestTime.date}</div>
			</div>
		</div>

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
