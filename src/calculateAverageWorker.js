onmessage = function (event) {
	let { timeValues, numElements } = event.data;

	function toWindows(inputArray, size) {
		return inputArray.reduce(
			(acc, _, index, arr) =>
				index + size > arr.length ? acc : acc.concat([arr.slice(index, index + size)]),
			[]
		);
	}

	let tmp = Array(numElements).fill({ avg: null, pb: false });
	let sum = 0,
		lowest = Infinity;
	let pb = false;

	// TODO: Make it work with DNF and +2

	toWindows(timeValues, numElements).forEach((ar) => {
		ar.sort((a, b) => a - b);
		let lowerIndex = Math.floor(ar.length * 0.1);
		let upperIndex = Math.ceil(ar.length * 0.9);

		sum = 0;
		for (let i = lowerIndex; i < upperIndex; i++) {
			sum += ar[i];
		}

		let avg = sum / (upperIndex - lowerIndex);
		if (avg < lowest) {
			lowest = avg;
			pb = true;
		} else {
			pb = false;
		}

		tmp.push({ avg, pb });
	});

	postMessage(tmp);
};
