<script>
	import initSqlJs from 'sql.js';
	import Modal from './Modal.svelte';
	import Papa from 'papaparse';
	import { db } from './../store.js';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	let files = [];
	let fileTypes = [];
	let parsed = [];

	let puzzleCategories = {};

	let showModal = false;
	let next = true;
	let state = 0;

	function initialImport(event) {
		files = event.target.files;
		fileTypes = new Array(files.length).fill('twisty');
	}

	function setFileType(index, type) {
		fileTypes[index] = type;
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

					const puzzle = puzzleNames[session_data[item]['opt']['scrType']] || '333';
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
							return [puzzle, category, it[0][it[0].length - 1], it[3], it[1], 0, it[2]];
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
		const createTableQuery = `CREATE TABLE twisty (
					puzzle varchar(10),
					category text,
					time int,
					date datetime,
					scramble text,
					penalty tinyint,
					comm text,
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
		const insertDataQuery = `INSERT INTO twisty VALUES (?, ?, ?, datetime(?, 'unixepoch'), ?, ?, ?, null, null, null, null, null, null, null, null, null, null, null)`;
		const stmt = $db.prepare(insertDataQuery);

		for (let i = 0; i < parsed.length; i++) {
			for (let j = 0; j < parsed[i].length; j++) {
				const data = parsed[i][j];
				if (
					puzzleCategories[data[0]].some((it) => it.category === data[1] && it.enabled === false)
				) {
					continue;
				}

				if (data[0] !== '') {
					if (fileTypes[i] === 'twisty') {
						data[3] = data[3] / 1000;
					}
					data[6] = data[6] === '' ? null : data[6];

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
				break;

			case 2:
				parsed = await parsed;
				await generateDB();
				state++;
				next = false;
				break;

			default:
				break;
		}
		state++;
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
</script>

<label
	for="fileInput"
	class="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
>
	Select File
</label>
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
	class="hidden"
/>

<Modal bind:showModal bind:next on:clickNext={changeState} on:clickDone={() => dispatch('done')}>
	<h2 slot="header">Select file types</h2>

	{#if state === 0}
		{#each files as file, index}
			<div>
				<!-- svelte-ignore a11y-label-has-associated-control -->
				<label>{file.name}</label>
				<select on:change={(e) => setFileType(index, e.target.value)}>
					<option value="twisty">Twisty Timer</option>
					<option value="cstimer">CSTimer</option>
				</select>
			</div>
		{/each}
	{:else if state === 1}
		{#await parsed}
			<p>Processing...</p>
		{:then p}
			<div class="flex">
				<h2>All</h2>
				<input type="checkbox" on:change={(e) => switchAll(e)} />
			</div>
			{#each Object.entries(puzzleCategories) as [puzzle, information]}
				<div class="my-4">
					<div class="flex md-2">
						<h3>{puzzle}</h3>
						<input type="checkbox" id={puzzle} on:change={(e) => switchPuzzle(e, puzzle)} />
					</div>

					{#each information as info}
						<div class="pl-4">
							<input
								type="checkbox"
								bind:checked={info.enabled}
								id={info.category}
								on:change={() => console.log(puzzleCategories)}
							/>
							<label for={info.category}>{info.category}</label>
						</div>
					{/each}
				</div>
			{/each}
		{:catch error}
			<p>{error.message}</p>
		{/await}
	{/if}
</Modal>
