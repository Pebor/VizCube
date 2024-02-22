<script>
    import { formatTime } from './../utils.js';

    export let queryData = [];

    const formatableKey = ['time', 'avg5', 'avg12', 'avg50', 'avg100', 'avg1000'];
</script>

<table class="table table-zebra w-full">
    <thead>
        <tr>
            {#each Object.keys(queryData[0]) as column}
                <th>{column}</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each queryData as row}
            <tr>
                {#each Object.entries(row) as [key, value]}
                    <td>{formatableKey.includes(key) && value != null ? formatTime(value) : key !== 'penalty' ?  value : value == 1 ? '+2' : value == 2 ? 'DNF' : ''}</td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>