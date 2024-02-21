import { writable, derived } from 'svelte/store';

export const db = writable(null);

export const currentTimes = writable([]);
export const currentTimesDNFs = writable([]);
export const avgs5 = writable([]);
export const avgs12 = writable([]);
export const avgs50 = writable([]);
export const avgs100 = writable([]);
export const avgs1000 = writable([]);

export const mainChart = writable(null);

export const puzzle = writable('');
export const puzzleOptions = writable([]);
export const category = writable('');
export const categoryOptions = writable([]);
export const currentStartDate = writable('');
export const currentEndDate = writable('');

export const dateQuery = derived([currentStartDate, currentEndDate], ([$currentStartDate, $currentEndDate]) => {
    return `strftime('%F', date)  >= '${$currentStartDate}' and strftime('%F', date)  <= '${$currentEndDate}'`;
});

export const categoryQuery = derived([category], ([$category]) => {
    if (typeof $category !== 'string') {
        let selected = $category.filter((cat) => cat.enabled);
        selected = selected.map((cat) => "'" + cat.category + "'");
        return `category IN (${selected.join(',')})`;
    } else {
        return `category is '${$category}'`;
    }
});

export const generalQuery = derived(
    [puzzle, categoryQuery, dateQuery],
    ([$puzzle, $categoryQuery, $dateQuery]) => {


       return `FROM twisty where puzzle is '${$puzzle}' and ${$categoryQuery} and ${$dateQuery} ORDER BY date`; 
    }
);

export const byDate = writable(false);

export const chartDateQuery = derived(
    [byDate, generalQuery],
    ([$byDate, $generalQuery]) => {
        return `${$byDate ? `, date` : ``} ${$generalQuery}`;
    }
);