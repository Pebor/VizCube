export function formatTime(milliseconds) {
	var hours = Math.floor(milliseconds / 3600000); // 1 hour = 3600000 milliseconds
	var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 milliseconds
	var seconds = Math.floor((milliseconds % 60000) / 1000); // 1 second = 1000 milliseconds

	var timeString = '';
	if (hours > 0) {
		timeString += hours.toString() + 'h ';
	}
	if (minutes > 0) {
		timeString += minutes.toString() + 'm ';
	}
	timeString += seconds.toString().padStart(2, '0') + 's';

	return timeString;
}
