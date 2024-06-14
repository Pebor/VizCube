<script>
	import { query } from './../database.js';
	import Modal from './Modal.svelte';
	import QueryTable from './QueryTable.svelte';

	let queryData = [];
	let error = null;
	let textareaValue = '';
	let showHelp = false;

	function processQuery() {
		error = null;
		try {
			queryData = query(textareaValue);
			if (queryData.time) {
			}
		} catch (err) {
			error = err.message;
		}
	}
</script>

<div class="flex flex-col">

	<div class="flex flex-col md:flex-row mx-16 mb-8 items-center gap-2 md:gap-4">
		<button class="btn btn-neutral w-fit" on:click={()=> showHelp = true}>help</button>

			<textarea
			class="textarea textarea-bordered w-full"
			type="text"
			bind:value={textareaValue}
			rows="1"
			placeholder="Enter your SQL query here"
		/>


		<button class="btn btn-accent w-fit" on:click={processQuery}>Confirm</button>
		
	</div>

	{#if error !== null}
		<div class="alert alert-error m-2 w-auto" role="alert">
			<strong class="font-bold">Error:</strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if queryData.length > 0}
		<QueryTable {queryData} />
	{/if}
</div>

<Modal bind:showModal={showHelp}>
	<h1 class="text-2xl mb-8 text-neutral-content font-bold">HELP</h1>

	<p class="font-bold">The table looks like this:</p>
	<pre class="font-mono my-2">CREATE TABLE solutions (
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
)</pre>
<p><b><i>time, avg5, avg12, avg50, avg100, avg1000</i></b> are stored in <b>miliseconds</b>, but in table views, they get formated.</p>
<p><b><i>penalty</i></b> has a format of <b>0 = no penalty</b>, <b>1 = +2</b> and <b>2 = DNF</b>.</p>
<p><b><i>comment</i></b> is <b><i>null</i></b> when empty.</p>
<p><b><i>Pb booleans</i></b> are set to true when the current solve or avg is a new lowest in it's puzzle and category.</p>
</Modal>
