<script>
	import initSqlJs from 'sql.js';
	import Modal from './Modal.svelte';
	import Papa from 'papaparse';
	import { db } from './../store.js';
	import { createEventDispatcher } from 'svelte';
	import { parse } from 'date-fns';
	const dispatch = createEventDispatcher();

	let files = [];
	let fileTypes = [];
	let fileInfo = [];
	let parsed = [];

	let puzzleCategories = {};
	let otherCategoryList = [];

	let showModal = false;
	let next = true;
	let state = 0;
	let waiting = false;

	let showHelp = false;

	let optionsValue;
	const possiblePuzzles = [
		'333',
		'222',
		'444',
		'555',
		'666',
		'777',
		'other',
		'clock',
		'mega',
		'pyra',
		'skewb',
		'sq1',
		'other'
	];

	function initialImport(event) {
		files = event.target.files;
		fileTypes = new Array(files.length).fill('twisty');
	}

	async function parseFiles() {
		let parsedFiles = [];
		puzzleCategories = {};

		for (let index = 0; index < fileTypes.length; index++) {
			let data = [];

			if (fileTypes[index] === 'twisty') {
				await new Promise((resolve) => {
					Papa.parse(files[index], {
						skipEmptyLines: true,
						complete: function (res) {
							let types = [];
							data = res.data;
							data = data.slice(1);

							// Extract unique puzzle types
							data.forEach((row) => {
								const puzzle = row[0];
								const category = row[1];
								const obj = { category, from: 'twisty', enabled: false };

								if (!puzzleCategories[puzzle]) {
									puzzleCategories[puzzle] = [];
								}
								if (!puzzleCategories[puzzle].some((it) => it.category === category)) {
									puzzleCategories[puzzle].push(obj);
								}
							});

							resolve();
						}
					});
				});
			} else if (fileTypes[index] === 'twisty_session') {
				await new Promise((resolve) => {
					Papa.parse(files[index], {
						skipEmptyLines: true,
						complete: function (res) {
							let types = [];
							data = res.data;

							const puzzle = fileInfo[index];
							const category = files[index].name;

							for (let i = 0; i < data.length; i++) {
								data[i] = [puzzle, category, data[i][0], data[i][2], data[i][1], 0, ''];
							};

							const obj = { category, from: 'twisty_session', enabled: false };

							if (!puzzleCategories[puzzle]) {
								puzzleCategories[puzzle] = [];
							}
							if (!puzzleCategories[puzzle].some((it) => it.category === category)) {
								puzzleCategories[puzzle].push(obj);
							}

							resolve();
						}
					});
				});
			} else if (fileTypes[index] === 'cstimer') {
				let temp_data = await JSON.parse(await files[index].text());
				let session_data = JSON.parse(temp_data['properties']['sessionData']);

				// Extract unique puzzle types
				for (let item in session_data) {
					// Map puzzle codes to puzzle names
					const puzzleNames = {
						'333': '333',
						'333fm': '333',
						'333oh': '333',
						'333ni': '333',

						'222so': '222',

						'444wca': '444',
						'4edge': '444',
						'444edo': '444',
						'444cto': '444',
						'444ll': '444',
						'444ctud': '444',
						'444ctrl': '444',
						'444l8e': '444',
						'444ud3c': '444',
						'444rlda': '444',
						'444rlca': '444',
						'444bld': '444',

						'555wca': '555',
						'555bld': '555',

						'666wca': '666',
						'777wca': '777',

						clkwca: 'clock',
						clko: 'clock',

						mgmp: 'mega',
						mgmc: 'mega',
						mlsll: 'mega',
						mgmpll: 'mega',
						mgmll: 'mega',
						klmso: 'mega',

						pyrso: 'pyra',
						pyro: 'pyra',
						pyrnb: 'pyra',
						pyr4c: 'pyra',

						skbso: 'skewb',
						skbo: 'skewb',
						skbnb: 'skewb',

						r3ni: '333',
						sqrs: 'sq1'
					};

					const getScrType = (item) => {
						if (session_data[item]['opt']) {
							return puzzleNames[session_data[item]['opt']['scrType']] || '333';
						} else if (session_data[item]['scrType']) {
							return puzzleNames[session_data[item]['scrType']];
						}
						return '333';
					};

					const puzzle = getScrType(item);
					const category = session_data[item]['name'];
					const obj = { category, from: 'cstimer', enabled: false };

					if (!puzzleCategories[puzzle]) {
						puzzleCategories[puzzle] = [];
					}
					if (!puzzleCategories[puzzle].some((it) => it.category === category)) {
						puzzleCategories[puzzle].push(obj);
					}

					data.push(
						temp_data[`session${item}`].map((it) => {
							return [
								puzzle, // puzzle
								category, // category
								it[0][1], // time
								it[3], // date
								it[1], // scramble
								it[0][0], // penalty
								it[2] // comment
							];
						})
					);
				}

				data = data.flat();
			}

			parsedFiles.push(data);
		}

		return parsedFiles;
	}

	async function generateDB() {
		const SQL = await initSqlJs({
			locateFile: (file) => `https://sql.js.org/dist/${file}`
		});

		// Create an in-memory SQLite database
		db.set(new SQL.Database());

		// Make avgs part of the database
		const createTableQuery = `
        drop table if exists solutions;
        CREATE TABLE solutions (
                    puzzle varchar(10),
                    category text,
                    time int,
                    date datetime,
                    scramble text,
                    penalty tinyint,
                    comment text,
                    avg5 int,
                    avg12 int,
                    avg50 int,
                    avg100 int,
                    avg1000 int,
                    timePb boolean,
                    avg5Pb boolean,
                    avg12Pb boolean,
                    avg50Pb boolean,
                    avg100Pb boolean,
                    avg1000Pb boolean
                );`;
		$db.run(createTableQuery);

		// Insert data into the table
		// puzzle, category, time, date, scramble, penalty, comment, avg5, avg12, avg50, avg100, avg1000, timePb, avg5Pb, avg12Pb, avg50Pb, avg100Pb, avg1000Pb
		const insertDataQuery = `INSERT INTO solutions VALUES (?, ?, ?, datetime(?, 'unixepoch'), ?, ?, ?, null, null, null, null, null, null, null, null, null, null, null)`;
		const stmt = $db.prepare(insertDataQuery);

		for (let i = 0; i < parsed.length; i++) {
			for (let j = 0; j < parsed[i].length; j++) {
				const data = parsed[i][j];
				if (puzzleCategories == undefined) continue;

				if (otherCategoryList.some((it) => it.puzzle === data[0] && it.info.category === data[1])) {
					data[0] = 'other';
				}

				if (
					puzzleCategories[data[0]].some((it) => it.category === data[1] && it.enabled === false)
				) {
					continue;
				}

				if (data[0] !== '') {
					if (fileTypes[i] === 'twisty') {
						data[3] = data[3] / 1000; // sqlite unixepoch takes seconds (unix time)
						if (data[5] == 1) data[2] = (parseInt(data[2]) + 2000).toString(); // +2 penalty
					} else if (fileTypes[i] === 'twisty_session') {
						function convertToMilliseconds(time) {
							if(time.includes(':')) { 
								const [minutes, secondsAndMilliseconds] = time.split(':');
								const [seconds, milliseconds] = secondsAndMilliseconds.split('.');
								const totalMilliseconds = parseInt(minutes) * 60 * 1000 + parseInt(seconds) * 1000 + parseInt(milliseconds);
								return totalMilliseconds;
							} else {
								const [seconds, milliseconds] = time.split('.');
								const totalMilliseconds = parseInt(seconds) * 1000 + parseInt(milliseconds);
								return totalMilliseconds;
							}
						}
						data[2] = convertToMilliseconds(data[2]);
						data[3] = Math.floor(new Date(data[3]).getTime() / 1000);

					} else if (fileTypes[i] === 'cstimer') {
						data[2] += data[5] == 200 ? 2000 : 0; // +2 penalty
					}

					data[6] = data[6] === '' ? null : data[6]; // make comments null if empty

					stmt.run(data);
				}
			}
		}

		stmt.free();
	}

	async function changeState() {
		switch (state + 1) {
			case 1:
				parsed = parseFiles();
				state++;
				break;

			case 2:
				var isValid = false;
				for (let puzzle in puzzleCategories) {
					isValid = puzzleCategories[puzzle].some((it) => it.enabled);
					if (isValid) break;
				}
				if (isValid) {
					waiting = true;
					parsed = await parsed;
					await generateDB();
					waiting = false;
					next = false;
					state++;
				}
				break;

			default:
				break;
		}
	}

	function switchPuzzle(event, puzzle) {
		puzzleCategories[puzzle] = puzzleCategories[puzzle].map((it) => {
			it.enabled = event.target.checked;
			return it;
		});
	}

	function switchAll(event) {
		for (let puzzle in puzzleCategories) {
			puzzleCategories[puzzle] = puzzleCategories[puzzle].map((it) => {
				document.getElementById(puzzle).checked = event.target.checked;
				it.enabled = event.target.checked;
				return it;
			});
		}
	}

	// TODO: Move to other in 'parsed' for creating the actual database dumbass
	function moveToOther(puzzle, info) {
		otherCategoryList.push({ puzzle, info });

		const indx = puzzleCategories[puzzle].indexOf(info);
		puzzleCategories[puzzle].splice(indx, 1);
		if (puzzleCategories[puzzle].length === 0) {
			delete puzzleCategories[puzzle];
		}

		if (!puzzleCategories['other']) {
			puzzleCategories['other'] = [];
		}
		// not sure if this would be needed and it complicates things
		// if (puzzleCategories['other'].some((it) => it.category === info.category)) {
		// 	info.category = puzzle + '_' + info.category;
		// }

		puzzleCategories['other'] = [...puzzleCategories['other'], info];
	}
</script>

<div class="relative">
	<input
		type="file"
		multiple
		on:click={(e) => (e.target.value = null)}
		on:change={(e) => {
			initialImport(e);
			next = true;
			state = 0;
			showModal = true;
		}}
		id="fileInput"
		class="file-input"
	/>
	<button class="btn btn-info btn-sm absolute -right-5 -top-5" on:click={() => (showHelp = true)}
		>info</button
	>
</div>

<Modal bind:showModal bind:next on:clickNext={changeState} on:clickDone={() => dispatch('done')}>
	{#if state === 0}
		<h1 class="text-xl mb-8 text-neutral-content font-bold">Select file types</h1>
		{#each files as file, index}
			<div class="form-control">
				<label class="label cursor-pointer">
					<!-- svelte-ignore a11y-label-has-associated-control -->
					<span class="label-text text-neutral-content text-md">{file.name}</span>
					{#if optionsValue === 'twisty_session'}
						<select
							class="select select-bordered ml-4"
							on:change={(e) => (fileInfo[index] = e.target.value)}
						>
							{#each possiblePuzzles as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
					{/if}
					<select
						class="select select-bordered ml-4"
						on:change={(e) => {
							fileTypes[index] = e.target.value;
							fileInfo[index] = '333';
						}}
						bind:value={optionsValue}
					>
						<option value="twisty">Twisty Timer</option>
						<option value="twisty_session">Twisty Timer (singular)</option>
						<option value="cstimer">CSTimer</option>
					</select>
				</label>
			</div>
		{/each}
	{:else if state === 1}
		<h1 class="text-xl mb-8 text-neutral-content font-bold">Select puzzles to import</h1>
		{#await parsed}
			<div class="w-full">
				<span class="loading loading-dots m-auto"></span>
			</div>
		{:then p}
			{#if waiting}
				<div class="w-full">
					<span class="loading loading-dots m-auto"></span>
				</div>
			{:else}
				<div class="flex">
					<label class="label cursor-pointer">
						<input type="checkbox" class="checkbox" on:change={(e) => switchAll(e)} />
						<span class="label-text text-2xl ml-2 font-bold">All</span>
					</label>
				</div>
				{#each Object.entries(puzzleCategories) as [puzzle, information]}
					<div class="my-4">
						<div class="flex md-2">
							<label class="label cursor-pointer">
								<input
									type="checkbox"
									class="checkbox"
									id={puzzle}
									on:change={(e) => switchPuzzle(e, puzzle)}
								/>
								<span class="label-text text-lg ml-2 font-bold">{puzzle}</span>
							</label>
						</div>

						{#each information as info}
							<div class="pl-4 flex justify-between">
								<div>
									<label class="label cursor-pointer">
										<input
											type="checkbox"
											bind:checked={info.enabled}
											id={info.category}
											class="checkbox"
										/>
										<span for={info.category} class="label-text ml-2">{info.category}</span>
										<span
											class="ml-2 badge badge-xs {info.from === 'cstimer'
												? 'badge-primary'
												: info.from === 'twisty'
													? 'badge-secondary'
													: 'badge-neutral'}"
										></span>
									</label>
								</div>
								{#if puzzle !== 'other'}
									<button
										type="button"
										class="btn btn-outline btn-neutral btn-sm"
										on:click={() => moveToOther(puzzle, info)}>other</button
									>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			{/if}
		{:catch error}
			<p>{error.message}</p>
		{/await}
	{:else if state === 2}
		<h1 class="text-xl mb-8 text-neutral-content font-bold">Importing</h1>
		<p>Database has been created <b>succesfully</b>.</p>
		<p>
			Next section might take a while, as it has to calculate averages. This depends on your device
		</p>
		<p>
			If it takes too long, check the developer console for any errors. If errors are present it's
			an please file an issue.
		</p>
	{/if}
</Modal>

<Modal bind:showModal={showHelp}>
	<h1 class="text-2xl mb-8 text-neutral-content font-bold">HELP</h1>

	<p>Currently, VizCube supports <b>Twisty Timer</b> and <b>CSTimer</b>.</p>
	<p>It is expected that you import an export of a <b>backup</b>.</p>
	<div class="divider"><b>Twisty Timer</b></div>
	<p>
		You can export your data from the side menu <b>Export/import</b> -> <b>Export</b> ->
		<b>For backup</b>.
	</p>
	<div class="divider"><b>Twisty timer (singular)</b></div>
	<p>
		You can export a singular category by going to the side menu <b>Export/import</b> -> <b>Export</b> ->
		<b>For other timers</b>.
	</p>
	<div class="divider"><b>CSTimer</b></div>
	<p>You can export your data from with <b>Export</b> -> <b>Export to file</b>.</p>
	<div class="divider"><b>Other timers</b></div>
	<p>If your timer of choice can export into <b>CSTimer (json)</b> it can be imported here.</p>
	<p>
		If that's not the case, but your timer app can export, <b>contact me</b> and I can add a parser.
	</p>
</Modal>
