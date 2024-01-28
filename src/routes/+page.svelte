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

	let mainChart;

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

		console.log(categoryQuery);

		current_times = querySimpleArray(
			`SELECT time FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} ORDER BY date;`
		).map((time, index) => ({ x: index, time }));

		avgs5 = querySimpleArray(
			`SELECT avg5 FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} ORDER BY date;`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs12 = querySimpleArray(
			`SELECT avg12 FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} ORDER BY date;`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs50 = querySimpleArray(
			`SELECT avg50 FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} ORDER BY date;`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs100 = querySimpleArray(
			`SELECT avg100 FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} ORDER BY date;`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs1000 = querySimpleArray(
			`SELECT avg1000 FROM twisty where puzzle is '${puzzle}' and ${categoryQuery} ORDER BY date;`
		).map((avg, index) => ({ x: index, time: avg }));

		if (mainChart) resetMainChart();
	}

	function resetMainChart() {
		mainChart.resetZoom();
	}
</script>

<main>
	{#if db_loaded}
		<div class="flex justify-between items-center mb-4">
			<div class="flex space-x-4">
				<div class="flex flex-col items-center">
					<label for="puzzlePicker" class="text-lg font-bold mb-1">Puzzle</label>
					<select
						id="puzzlePicker"
						bind:value={puzzle}
						selected={puzzle}
						on:change={() => {
							changePuzzle();
						}}
						class="px-3 py-2 border border-gray-300 rounded-md"
					>
						{#each puzzleOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col items-center">
					<label for="categoryPicker" class="text-lg font-bold mb-1">Category</label>
					<select
						id="categoryPicker"
						bind:value={category}
						selected={category}
						on:change={() => {
							changeCategories();
						}}
						class="px-3 py-2 border border-gray-300 rounded-md"
					>
						{#each categoryOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>

					<button type="button" on:click={() => (showCatMore = true)}>...</button>
					<Modal bind:showModal={showCatMore} done={true} on:clickDone={() => selectCategories()}>
						{#each categorySelectedOptions as { category, enabled }}
							<div class="flex items-center">
								<input type="checkbox" id={category} bind:checked={enabled} class="mr-2" />
								<label for={category}>{category}</label>
							</div>
						{/each}
					</Modal>
				</div>
			</div>

			<ImportFile on:done={handleFileChange} />
		</div>

		<LineChartBasic
			bind:chart={mainChart}
			data={current_times}
			avg5={avgs5}
			avg12={avgs12}
			avg50={avgs50}
			avg100={avgs100}
			avg1000={avgs1000}
		/>
		<button
			on:click={() => resetMainChart()}
			class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
		>
			Reset zoom
		</button>

		<div>
			<button
				on:click={() => {
					advanced = !advanced;
				}}
				class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
			>
				{#if advanced}
					Hide
				{:else}
					Show
				{/if}
			</button>
		</div>

		{#if advanced}
			<Advanced />
		{/if}
	{:else}
		<div class="center">
			{#if loading && !db_loaded}
				<p>Loading...</p>
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
