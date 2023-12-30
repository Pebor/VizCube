<script>
	import Advanced from './../components/Advanced.svelte';
	import LineChartBasic from './../components/LineChartBasic.svelte';
	import initSqlJs from 'sql.js';
	import Papa from 'papaparse';
	import { db } from './../store.js';
	import { query, querySimpleArray } from './../database.js';

	let file;
	let loading = false;

	let puzzle, category;

	let puzzleOptions = [];
	let categoryOptions = [];

	let advanced = false;
	let db_loaded = false;

	let current_times;
	let avgs5;
	let avgs12;
	let avgs50;
	let avgs100;
	let avgs1000;

	let chart;

	async function handleFileChange(event) {
		const selectedFile = event.target.files[0];

		if (!selectedFile) return;

		Papa.parse(selectedFile, {
			complete: async function (results) {
				const SQL = await initSqlJs({
					locateFile: (file) => `https://sql.js.org/dist/${file}`
				});

				// Create an in-memory SQLite database
				db.set(new SQL.Database());

				// Make avgs part of the database
				const createTableQuery = `CREATE TABLE twisty (
					puzzle varchar(10),
					category text,
					time int,
					date datetime,
					scramble text,
					penalty smallint,
					avg5 int,
					avg12 int,
					avg50 int,
					avg100 int,
					avg1000 int
				);`;
				$db.run(createTableQuery);

				// Insert data into the table
				const insertDataQuery = `INSERT INTO twisty VALUES (?, ?, ?, datetime(?, 'unixepoch'), ?, ?, null, null, null, null, null)`;
				const stmt = $db.prepare(insertDataQuery);

				for (let i = 1; i < results.data.length; i++) {
					const data = results.data[i];

					if (data[0] !== '') {
						data[3] = data[3] / 1000;

						stmt.run(data.slice(0, 6));
					}
				}

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

						function calculateAverage(numElements) {
							let tmp = [];
							let count = 0,
								sum = 0;

							toWindows(timeValues, numElements).forEach((ar) => {
								// Sort the array
								let sortedArray = ar.sort((a, b) => a - b);
								// Calculate the indices for 10% and 90%
								let lowerIndex = Math.floor(sortedArray.length * 0.1);
								let upperIndex = Math.ceil(sortedArray.length * 0.9);
								// Slice the array to remove the first and last 10%
								let slicedArray = sortedArray.slice(lowerIndex, upperIndex);

								slicedArray.forEach((val, idx) => {
									sum += val;

									if (idx == slicedArray.length - 1) {
										count++;
										let avg = sum / slicedArray.length;
										tmp.push(avg);
										sum = 0;
									}
								});
							});

							// Add NULLs to the start of the array
							for (let i = 0; i < numElements; i++) {
								tmp.unshift(null);
							}

							return tmp;
						}

						avgs5 = calculateAverage(5);
						avgs12 = calculateAverage(12);
						avgs50 = calculateAverage(50);
						avgs100 = calculateAverage(100);
						avgs1000 = calculateAverage(1000);

						const updateQuery = `UPDATE twisty SET avg5 = ?, avg12 = ?, avg50 = ?, avg100 = ?, avg1000 = ? where puzzle is '${puzzleOptions[i]}' and category is '${categoryOptions[j]}' and date is ?;`;
						const new_stmt = $db.prepare(updateQuery);

						// Start a transaction
						$db.run('BEGIN TRANSACTION;');

						timeValues.forEach((element, index) => {
							new_stmt.run([
								avgs5[index],
								avgs12[index],
								avgs50[index],
								avgs100[index],
								avgs1000[index],
								dateValues[index]
							]);
						});

						// Commit the transaction
						$db.run('COMMIT;');

						new_stmt.free();
					}
				}

				changeCategories();

				stmt.free();
				db_loaded = true;
			}
		});
	}

	function changeCategories() {
		categoryOptions = querySimpleArray(
			`Select distinct category from twisty where puzzle is '${puzzle}';`
		);
		categoryOptions = categoryOptions.filter((value) => value !== '');
		category = categoryOptions[0];

		updateAvgs();
	}

	function toWindows(inputArray, size) {
		return inputArray.reduce(
			(acc, _, index, arr) =>
				index + size > arr.length ? acc : acc.concat([arr.slice(index, index + size)]),
			[]
		);
	}

	function updateAvgs() {
		current_times = querySimpleArray(
			`SELECT time FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		).map((time, index) => ({ x: index, time }));

		avgs5 = querySimpleArray(
			`SELECT avg5 FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs12 = querySimpleArray(
			`SELECT avg12 FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs50 = querySimpleArray(
			`SELECT avg50 FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs100 = querySimpleArray(
			`SELECT avg100 FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		).map((avg, index) => ({ x: index, time: avg }));

		avgs1000 = querySimpleArray(
			`SELECT avg1000 FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		).map((avg, index) => ({ x: index, time: avg }));
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
							changeCategories();
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
						on:change={updateAvgs}
						class="px-3 py-2 border border-gray-300 rounded-md"
					>
						{#each categoryOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>
			</div>

			<div>
				<label
					for="fileInput"
					class="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
				>
					Upload File
				</label>
				<input type="file" on:change={handleFileChange} id="fileInput" class="hidden" />
			</div>
		</div>

		<LineChartBasic
			data={current_times}
			avg5={avgs5}
			avg12={avgs12}
			avg50={avgs50}
			avg100={avgs100}
			avg1000={avgs1000}
		/>

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
				<label
					for="fileInput"
					class="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
				>
					Select File
				</label>
				<input
					type="file"
					on:change={(e) => {
						handleFileChange(e);
						loading = true;
					}}
					id="fileInput"
					class="hidden"
				/>
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
