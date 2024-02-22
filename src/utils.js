export function formatTime(milliseconds) {
	var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
	var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
	var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds
	var days = Math.floor(hours / 24);
	var weeks = Math.floor(days / 168);
	var months = Math.floor(weeks / 4);
	milliseconds = (milliseconds % 1000).toString().slice(0, 2);
	hours -= days * 24;
	days -= weeks * 168;
	weeks -= months * 4;

	var timeString = '';

	timeString += months > 0 ? months.toString() + 'm ' : '';
	timeString += weeks > 0 ? weeks.toString() + 'w ' : '';
	timeString += days > 0 ? days.toString() + 'd ' : '';
	timeString += hours > 0 ? hours.toString() + 'h ' : '';
	timeString += minutes > 0 ? minutes.toString() + 'm ' : '';

	timeString += hours === 0 ? ' ' + seconds.toString().padStart(2, '0') + 's' : '';
	timeString += hours === 0 && minutes < 10 ? ' ' + milliseconds.padStart(2, '0') + 'ms' : '';

	return timeString;
}

export function formatHour(hour) {
  var ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // Handle midnight (0 hours)

  return hour + ' ' + ampm;
}

