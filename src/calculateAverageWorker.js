onmessage = function (event) {
	let { timeValues, numElements, penaltyValues } = event.data;

	function toWindows(inputArray, size) {
		return inputArray.reduce(
			(acc, _, index, arr) =>
				index + size > arr.length ? acc : acc.concat([arr.slice(index, index + size)]),
			[]
		);
	}

	// Transform timeValues based on penaltyValues
	timeValues = timeValues.map((value, index) => {
		if (penaltyValues[index] === 2) {
			return Number.MIN_VALUE;
		} else {
			return value;
		}
	});

	let tmp = Array(numElements).fill({ avg: null, pb: false });
	let sum = 0,
		lowest = Infinity;
	let pb = false;
	let lowerIndex = Math.ceil(numElements * 0.1);
	let upperIndex = Math.floor(numElements * 0.9);
	let diff = upperIndex - lowerIndex;

	toWindows(timeValues, numElements).forEach((ar) => {
		ar.sort((a, b) => a - b);
		ar = ar.slice(lowerIndex, upperIndex);

		if (ar.includes(Number.MIN_VALUE)) {
			tmp.push({ avg: null, pb: 0 });
		} else {
			sum = ar.reduce((acc, curr) => acc + curr, 0);
			

			let avg = sum / (diff);
			if (avg < lowest) {
				lowest = avg;
				pb = true;
			} else {
				pb = false;
			}

			tmp.push({ avg, pb });
		}
	});

	postMessage(tmp);
};
