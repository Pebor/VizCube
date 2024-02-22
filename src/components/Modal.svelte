<script>
	import { createEventDispatcher } from 'svelte';

	export let showModal; // boolean
	export let next = false; // boolean
	export let done = next ? true : false;
	export let width = '';

	let dialog; // HTMLDialogElement
	const dispatch = createEventDispatcher();

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
	class="modal m-auto"
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation class="modal-box min-w-fit {width}">
		<slot />
		<div class="divider mb-2 mt-8" />
		<!-- svelte-ignore a11y-autofocus -->
		<div class="flex justify-between">
			<button class="btn btn-sm btn-error" autofocus on:click={() => dialog.close()}>close</button>
			<div>
				{#if next}
					<button
						class="btn btn-sm btn-info"
						on:click={() => {
							dispatch('clickNext');
						}}>next</button
					>
				{/if}
				{#if !next && done}
					<button
						class="btn btn-sm btn-success"
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