<script>
	import { Bar } from 'svelte-chartjs';
	import { Chart } from 'chart.js/auto';

	export let data;
</script>

<div class="relative w-full">
	<Bar
		options={{
			maintainAspectRatio: false,
			aspectRatio: 1,
			responsive: true,
			plugins: {
				legend: false,
			}
		}}
		data={{
            labels: data.map((item) => item.x),
            datasets: [
                {
                    data: data.map((item) => item.y),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        }}
	/>
</div>
