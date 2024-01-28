<script>
	import { createEventDispatcher } from 'svelte';

	export let showModal; // boolean
	export let next = false; // boolean
	export let done = next ? true : false;

	let dialog; // HTMLDialogElement
	const dispatch = createEventDispatcher();

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
		<slot name="header" />
		<hr />
		<slot />
		<hr />
		<!-- svelte-ignore a11y-autofocus -->
		<div class="flex justify-between">
			<button autofocus on:click={() => dialog.close()}>close</button>
			<div>
				{#if next}
					<button
						on:click={() => {
							dispatch('clickNext');
						}}>next</button
					>
				{/if}
				{#if !next && done}
					<button
						on:click={() => {
							dialog.close();
							dispatch('clickDone');
						}}>done</button
					>
				{/if}
			</div>
		</div>
	</div>
</dialog>

<style>
	dialog {
		width: 60%;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
		border: 1px solid #ccc;
		border-radius: 0.2em;
		padding: 0em 0.3em;
	}

	hr {
		margin: 0.25em 0;
	}
</style>
