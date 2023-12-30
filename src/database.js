import { get } from 'svelte/store';
import { db } from './store.js';

export function querySimpleArray(query) {
	let stmt = get(db).prepare(query);

	let queryResult = [];
	while (stmt.step()) {
		queryResult.push(stmt.getAsObject());
	}

	stmt.free();

	return queryResult.map((obj) => Object.values(obj)[0]);
}

export function query(query) {
	let stmt = get(db).prepare(query);

	let queryResult = [];
	while (stmt.step()) {
		queryResult.push(stmt.getAsObject());
	}

	stmt.free();

	return queryResult;
}
