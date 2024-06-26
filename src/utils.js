export function formatTime(milliseconds, wcaFormat = false) {
	var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
	var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
	var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds
	var days = Math.floor(hours / 24);
	var weeks = Math.floor(days / 168);
	var months = Math.floor(weeks / 4);
	milliseconds = Math.floor((milliseconds % 1000)/10).toString().slice(0, 2).padStart(2, '0');
	hours -= days * 24;
	days -= weeks * 168;
	weeks -= months * 4;

	var timeString = '';

	timeString += months > 0 ? months.toString() + 'm ' : '';
	timeString += weeks > 0 ? weeks.toString() + 'w ' : '';
	timeString += days > 0 ? days.toString() + 'd ' : '';
	timeString += hours > 0 ? hours.toString() + 'h ' : '';

	if (hours === 0 && minutes < 1 && wcaFormat) {
		if (minutes > 0) {
			timeString += minutes.toString() + ':' + seconds.toString().padStart(2, '0') + '.' + milliseconds + 'm';
		} else {
			timeString += seconds.toString() + '.' + milliseconds + 's';
		}
	} else {
		timeString += minutes > 0 ? minutes.toString() + 'm ' : '';
		timeString += hours === 0 ? ' ' + seconds.toString().padStart(2, '0') + 's' : '';
		timeString += hours === 0 && minutes < 10 ? ' ' + milliseconds + 'ms' : '';
	}

	return timeString;
}

export function formatHour(hour) {
  var ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // Handle midnight (0 hours)

  return hour + ' ' + ampm;
}

const formatableKey = ['time', 'avg5', 'avg12', 'avg50', 'avg100', 'avg1000'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatTable(key, value) {
	if (formatableKey.includes(key) && value != null) {
		return formatTime(value, true);
	} else if (key === 'day') {
		return daysOfWeek[value];
	} else if (key === 'shortDay') {
		return daysOfWeek[value].substring(0, 3);
	} else if (key === 'hour') {
		return formatHour(value);
	} else if (key === 'penalty') {
		if (value == 1) {
			return '+2';
		} else if (value == 2) {
			return 'DNF';
		} else {
			return '';
		}
	} else if (value == null || value === 0)
		return '';
	else {
		return value;
	}
}
