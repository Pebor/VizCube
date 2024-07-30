<script>
	import { DatePicker } from '@svelte-plugins/datepicker';
	import { format } from 'date-fns';
	import { currentEndDate, currentStartDate } from '../store';
	import { createEventDispatcher } from 'svelte';

	const dispatchEvent = createEventDispatcher();

	const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

	const getDateFromToday = (days) => {
		return Date.now() - days * MILLISECONDS_IN_DAY;
	};

	export let constStartDate;
	export let constEndDate;

	let presetRanges = [];
	$: {
		presetRanges = [
			{
				label: 'Since start',
				start: constStartDate,
				end: constEndDate
			},
			{
				label: 'Last day',
				start: getDateFromToday(0),
				end: getDateFromToday(0)
			},
			{
				label: 'Last Week',
				start: getDateFromToday(6),
				end: getDateFromToday(0)
			},
			{
				label: 'Last Month',
				start: getDateFromToday(29),
				end: getDateFromToday(0)
			},
			{
				label: 'Last 3 Months',
				start: getDateFromToday(89),
				end: getDateFromToday(0)
			},
			{
				label: 'Last 6 Months',
				start: getDateFromToday(179),
				end: getDateFromToday(0)
			},
			{
				label: 'Last Year',
				start: getDateFromToday(364),
				end: getDateFromToday(0)
			}
		];
		startDate = constStartDate;
		endDate = constEndDate;
	}

	let startDate = constStartDate;
	let endDate = constEndDate;

	let dateFormat = 'MMM d, yyyy';
	let isOpen = false;

	let formattedStartDate = '';

	const onClearDates = () => {
		startDate = '';
		endDate = '';
	};

	const toggleDatePicker = () => (isOpen = !isOpen);
	const formatDate = (dateString) => (dateString && format(new Date(dateString), dateFormat)) || '';

	$: formattedStartDate = formatDate(startDate);
	$: formattedEndDate = formatDate(endDate);

	function handleClick() {
		currentStartDate.set(new Date(startDate).toISOString().split('T')[0]);
		currentEndDate.set(new Date(endDate).toISOString().split('T')[0]);
		dispatchEvent('apply');
	}
</script>

<div class="date-filter flex items-center justify-center space-x-4 flex-row shrink-0">
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<DatePicker
		theme="custom-datepicker"
		bind:isOpen
		bind:startDate
		bind:endDate
		isRange
		showPresets
		!includeFont
		{presetRanges}
	>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="date-field" on:click={toggleDatePicker} class:open={isOpen}>
			<i class="icon-calendar" />
			<div class="date inline-block w-46">
				{#if startDate}
					{formattedStartDate} - {formattedEndDate || formattedStartDate}
				{:else}
					Pick a date
				{/if}
			</div>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			{#if startDate}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<span on:click={onClearDates}>
					<i class="os-icon-x" />
				</span>
			{/if}
		</div>
	</DatePicker>
	<button class="btn btn-sm btn-success" on:click={handleClick}>Apply</button>
</div>

<style>
	.date-field {
		align-items: center;
		background-color: #1d232a;
		border-bottom: 2px solid #7480ff;
		border-radius: 10px;
		display: inline-flex;
		gap: 8px;
		min-width: 100px;
		padding: 16px;
	}

	.date-field.open {
		border-bottom: 1px solid #7480ff;
	}

	.date-field .icon-calendar {
		background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEmSURBVHgB7ZcPzcIwEMUfXz4BSCgKwAGgACRMAg6YBBxsOMABOAAHFAXgAK5Z2Y6lHbfQ8SfpL3lZaY/1rb01N+BHUKSMNBfEJjZWISA56Uo6C2KvVpkgFn9oRx9vICFtUT1JKO3tvRtZdjBxXQs+YY+1FenIfuesPUGVVLzfRWKvmrSzbbN19wS+kAb2+sCEuUxrYzkbe4YvCVM2Vr5NPAkVa+van7Wn38U95uTpN5TJ/A8ZKemAakmbmJJGpI0gVmwA0huieFItjG19DgTHtwIZhCfZq3ztCuzQYh+FKBSvusjAGs8PnLYkLgMf34JoIBqIBqKBaIAb0Kw9RlhMCTbzzPWAqYq7LsuPaGDUsYmznaOk5zChUJTNQ4TFVMkrOL4HPsoNn26PxROHCggAAAAASUVORK5CYII=)
			no-repeat center center;
		background-size: 14px 14px;
		height: 14px;
		width: 14px;
	}

	:global(.range) {
		background-color: #ffffff;
		border: 1px solid #0d1114;
	}

	:global(.datepicker[data-picker-theme='custom-datepicker']) {
		--datepicker-container-background: #1d232a;
		--datepicker-container-border: 1px solid #0d1114;

		--datepicker-calendar-header-text-color: #fff;
		--datepicker-calendar-dow-color: #fff;
		--datepicker-calendar-day-color: #fff;
		--datepicker-calendar-day-color-disabled: #0d1114;
		--datepicker-calendar-range-selected-background: #0d1114;

		--datepicker-calendar-header-month-nav-background-hover: #0d1114;
		--datepicker-calendar-header-month-nav-icon-next-filter: invert(100);
		--datepicker-calendar-header-month-nav-icon-prev-filter: invert(100);
		--datepicker-calendar-header-year-nav-icon-next-filter: invert(100);
		--datepicker-calendar-header-year-nav-icon-prev-filter: invert(100);

		--datepicker-calendar-split-border: 1px solid #0d1114;

		--datepicker-presets-border: 1px solid #0d1114;
		--datepicker-presets-button-background-active: #0d1114;
		--datepicker-presets-button-color: #fff;
		--datepicker-presets-button-color-active: #fff;
		--datepicker-presets-button-color-hover: #333;
		--datepicker-presets-button-color-focus: #333;

		--datepicker-calendar-range-background: #0d1114;
		--datepicker-calendar-range-start-box-shadow: 0;
		--datepicker-calendar-range-end-box-shadow: 0;
		--datepicker-calendar-range-selected-background: #0d1114;
		--datepicker-font-family: 'Inter', sans-serif;
		--datepicker-calendar-range-selected-start-border-radius: 20px;
		--datepicker-calendar-range-selected-border-radius: 20px;
	}
</style>
