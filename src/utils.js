export function formatTime(milliseconds) {
	var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
	var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
	var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds
	var days = Math.floor(hours / 24);
	var weeks = Math.floor(days / 168);
	var months = Math.floor(weeks / 4);
	var milliseconds = (milliseconds % 1000).toString().slice(0, 2);
	hours -= days * 24;
	days -= weeks * 168;
	weeks -= months * 4;

	var timeString = '';

	timeString += months > 0 ? months.toString() + 'months ' : '';
	timeString += weeks > 0 ? weeks.toString() + 'weeks ' : '';
	timeString += days > 0 ? days.toString() + 'days ' : '';
	timeString += hours > 0 ? hours.toString() + 'h ' : '';
	timeString += minutes > 0 ? minutes.toString() + 'm ' : '';

	timeString += seconds.toString().padStart(2, '0') + 's';
	timeString += hours === 0 ? ' ' + milliseconds.padStart(2, '0') + 'ms' : '';

	return timeString;
}
