<script>
	import Advanced from './../components/Advanced.svelte';
	import LineChartBasic from './../components/LineChartBasic.svelte';
	import initSqlJs from 'sql.js';
	import Papa from 'papaparse';
	import { db } from './../store.js';
	import { query, querySimpleArray } from './../database.js';

	let file;
	let puzzle, category;

	let puzzleOptions = [];
	let categoryOptions = [];

	let advanced = true;
	let db_loaded = false;

	let basicInfo;
	let basicInfoAvg5;
	let basicInfoAvg12;
	let basicInfoAvg50;
	let basicInfoAvg100;
	let basicInfoAvg1000;

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
	        date int,
	        scramble text,
	        penalty smallint,
	        comment text
	      );`;

				$db.run(createTableQuery);

				// Insert data into the table
				const insertDataQuery = `INSERT INTO twisty VALUES (?, ?, ?, ?, ?, ?, ?)`;
				const stmt = $db.prepare(insertDataQuery);

				for (let i = 1; i < results.data.length; i++) {
					const data = results.data[i];
					if (data[0] !== '') {
						stmt.run(data);
					}
				}

				puzzleOptions = querySimpleArray('Select distinct puzzle from twisty;');
				puzzleOptions = puzzleOptions.filter((value) => value !== '');
				puzzleOptions.sort();
				puzzle = puzzleOptions[0];

				changeCategory();
				updatethat();

				stmt.free();
				db_loaded = true;
			}
		});
	}

	function changeCategory() {
		categoryOptions = querySimpleArray(
			`Select distinct category from twisty where puzzle is '${puzzle}';`
		);
		categoryOptions = categoryOptions.filter((value) => value !== '');
		category = categoryOptions[0];
	}

	function toWindows(inputArray, size) {
		return inputArray.reduce(
			(acc, _, index, arr) =>
				index + size > arr.length ? acc : acc.concat([arr.slice(index, index + size)]),
			[]
		);
	}

	function updatethat() {
		basicInfo = query(
			`SELECT time FROM twisty where puzzle is '${puzzle}' and category is '${category}';`
		);
		basicInfo = basicInfo.map(function (obj, index) {
			return { x: index, time: obj.time };
		});

		function calculateAverage(basicInfo, numElements) {
			let tmp = [];
			let count = 0,
				sum = 0;

			toWindows(basicInfo, numElements).forEach((ar) => {
				// Sort the array
				let sortedArray = ar.sort((a, b) => a.time - b.time);
				// Calculate the indices for 10% and 90%
				let lowerIndex = Math.floor(sortedArray.length * 0.1);
				let upperIndex = Math.ceil(sortedArray.length * 0.9);
				// Slice the array to remove the first and last 10%
				let slicedArray = sortedArray.slice(lowerIndex, upperIndex);

				slicedArray.forEach((val, idx) => {
					sum += val.time;

					if (idx == slicedArray.length - 1) {
						count++;
						let avg = sum / slicedArray.length;
						tmp.push({ time: avg, x: numElements - 1 + count });
						sum = 0;
					}
				});
			});

			return tmp;
		}

		basicInfoAvg5 = calculateAverage(basicInfo, 5);
		basicInfoAvg12 = calculateAverage(basicInfo, 12);
		basicInfoAvg50 = calculateAverage(basicInfo, 50);
		basicInfoAvg100 = calculateAverage(basicInfo, 100);
		basicInfoAvg1000 = calculateAverage(basicInfo, 1000);
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
							changeCategory();
							updatethat();
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
						on:change={updatethat}
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
			data={basicInfo}
			avg5={basicInfoAvg5}
			avg12={basicInfoAvg12}
			avg50={basicInfoAvg50}
			avg100={basicInfoAvg100}
			avg1000={basicInfoAvg1000}
		/>

		{#if advanced}
			<Advanced />
		{/if}
	{:else}
		<div class="center">
			<label
				for="fileInput"
				class="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
			>
				Select File
			</label>
			<input type="file" on:change={handleFileChange} id="fileInput" class="hidden" />
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
