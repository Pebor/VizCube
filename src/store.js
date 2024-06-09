import { writable, derived } from 'svelte/store';
import { querySimpleArray } from './database.js';
import { formatTime } from './utils.js';

export const db = writable(null);

export const currentTimes = writable([]);
export const currentTimesDNFs = writable([]);
export const currentTimes2s = writable([]);
export const currentTimesPBs = writable([]);
export const avgs5 = writable([]);
export const avgs12 = writable([]);
export const avgs50 = writable([]);
export const avgs100 = writable([]);
export const avgs1000 = writable([]);

export const matrixData = writable([]);

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
        if ($puzzle === 'ALL') return `FROM solutions where ${$dateQuery}`;

        return `FROM solutions where puzzle is '${$puzzle}' and ${$categoryQuery} and ${$dateQuery}`; 
    }
);

export const byDate = writable(false);

export const chartDateQuery = derived(
    [byDate, generalQuery],
    ([$byDate, $generalQuery]) => {
        return `${$byDate ? `, date` : ``} ${$generalQuery} ORDER BY date`;
    }
);

export const longestSession = writable([]);

export const calculateSession = function (generalQuery, longestSession) {
    const entries = querySimpleArray(`SELECT date ${generalQuery} order by date`);
    let tmpLongestSession = [];
    let currentSession = [];
    let previousDate = null;

    entries.forEach((entry) => {
        const currentDate = new Date(entry);

        if (previousDate && currentDate - previousDate > 3600000) {
            // More than 1 hour has passed since the last entry, start a new session
            if (currentSession.length > tmpLongestSession.length) {
                tmpLongestSession = currentSession;
            }

            currentSession = [entry];
        } else {
            // Less than 1 hour has passed since the last entry, continue the current session
            currentSession.push(entry);
        }

        previousDate = currentDate;
    });

    // Check if the last session is the longest one
    if (currentSession.length > tmpLongestSession.length) {
        tmpLongestSession = currentSession;
    }

    longestSession.set({
        length: tmpLongestSession.length,
        time: formatTime(Date.parse(tmpLongestSession[tmpLongestSession.length - 1]) - Date.parse(tmpLongestSession[0])),
        start: tmpLongestSession[0],
        end: tmpLongestSession[tmpLongestSession.length - 1]
    });

    // console.log(
    //     `Longest session has ${$longestSession.length} entries and lasted ${formatTime(
    //         Date.parse($longestSession[$longestSession.length - 1]) - Date.parse($longestSession[0])
    //     )} from ${$longestSession[0]} to ${$longestSession[$longestSession.length - 1]}`
    // );

};