"use strict";

// Debug console logging
const isDev = false;
const config = {
	disable: document.querySelector('#disable').value,
	allowList: {},
	forbidList: {},
};
let extensions = {};

function saveOptions(e) {
	e.preventDefault();
	if (isDev) console.log('Saving settings');

	// Update config before saving
	config.disable = document.querySelector('#disable').value;

	browser.storage.sync.set(config);
}

function restoreOptions() {
	function setCurrentChoices(result) {
		if (isDev) console.log(result);
		if (typeof result.disable === 'string') {
			config.disable = result.disable
			document.querySelector('#disable').value = result.disable;
		}
		if (typeof result.allowList === 'object') {
			config.allowList = result.allowList;
			renderAllowList();
		}
		if (typeof result.forbidList === 'object') {
			config.forbidList = result.forbidList;
			renderForbidList();
		}
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	const getting = browser.storage.sync.get();
	getting.then(setCurrentChoices, onError);
}

function fetchTwitchExtensions() {
	fetch('https://twitch-tools.rootonline.de/twitch_extensions.php', { cache: 'no-cache' })
		.then(response => response.json())
		.then(data => {
			if (isDev) console.log(data);
			extensions = data;
			generateAddButtons();
			// Re-render lists now that we have names for the IDs
			renderAllowList();
			renderForbidList();
		});
}

function generateExtensionAddHTML(id) {
	const select = document.createElement('select');
	select.id = id;
	select.className = 'extension-select';

	let html = '<option value=""></option>';
	for (const [key, value] of Object.entries(extensions)) {
		// Don't list already added extensions
		if (
			(id === 'allowListAddSelect' && typeof config.allowList[key] !== 'undefined') ||
			(id === 'forbidListAddSelect' && typeof config.forbidList[key] !== 'undefined')) {
			continue;
		}

		const opt = document.createElement('option');
		opt.value = key;
		opt.innerText = value;
		html += opt.outerHTML;
	}
	select.innerHTML = html;

	return select.outerHTML;
}

function generateAddButtons() {
	// Allow list select
	let html = generateExtensionAddHTML('allowListAddSelect');
	document.querySelector('#allowlistAdd').innerHTML = html;

	// Forbid list select
	html = generateExtensionAddHTML('forbidListAddSelect');
	document.querySelector('#forbidlistAdd').innerHTML = html;

	$('.extension-select').select2();
	$('#allowListAddSelect').on('select2:select', function (e) {
		addAllowListEntry(e);
	});
	$('#forbidListAddSelect').on('select2:select', function (e) {
		addForbidListEntry(e);
	});
}

function addAllowListEntry(e) {
	e.preventDefault();
	if (document.querySelector('#allowListAddSelect').value.length > 0) {
		config.allowList[document.querySelector('#allowListAddSelect').value] = true;
		saveOptions(e);
		renderAllowList();
		generateAddButtons();
	}
}

function removeAllowListEntry(e) {
	e.preventDefault();
	if (typeof e.target.id !== 'undefined') {
		const target = e.target.id.split('-', 2);
		if (target.length == 2) {
			delete config.allowList[target[1]];
			saveOptions(e);
			renderAllowList();
			generateAddButtons();
		}
	}
}

function addForbidListEntry(e) {
	e.preventDefault();
	if (document.querySelector('#forbidListAddSelect').value.length > 0) {
		config.forbidList[document.querySelector('#forbidListAddSelect').value] = true;
		saveOptions(e);
		renderForbidList();
		generateAddButtons();
	}
}

function removeForbidListEntry(e) {
	e.preventDefault();
	if (typeof e.target.id !== 'undefined') {
		const target = e.target.id.split('-', 2);
		if (target.length == 2) {
			delete config.forbidList[target[1]];
			saveOptions(e);
			renderForbidList();
			generateAddButtons();
		}
	}
}

function renderAllowList() {
	let html = '<table>';
	for (const [key, _value] of Object.entries(config.allowList)) {
		html += '<tr>';
		const td = document.createElement('td');
		const a = document.createElement('a');
		a.href = 'https://dashboard.twitch.tv/extensions/' + key;
		a.target = '_blank';
		a.rel = 'noopener';
		if (typeof extensions[key] !== 'undefined') {
			a.innerText = extensions[key];
		} else {
			a.innerText = key;
		}
		td.innerHTML = a.outerHTML;
		html += td.outerHTML;
		const b = document.createElement('button');
		b.className = 'remove-allow-button';
		b.id = 'allow-' + key;
		b.innerText = 'Remove';
		html += '<td class="pull-right-button">' + b.outerHTML + '</td>';
		html += '</tr>';
	}
	html += '</table>';
	document.querySelector('#allowList').innerHTML = html;
	document.querySelectorAll('.remove-allow-button').forEach(removeButton => removeButton.addEventListener('click', removeAllowListEntry));
}

function renderForbidList() {
	let html = '<table>';
	for (const [key, _value] of Object.entries(config.forbidList)) {
		html += '<tr>';
		const td = document.createElement('td');
		const a = document.createElement('a');
		a.href = 'https://dashboard.twitch.tv/extensions/' + key;
		a.target = '_blank';
		a.rel = 'noopener';
		if (typeof extensions[key] !== 'undefined') {
			a.innerText = extensions[key];
		} else {
			a.innerText = key;
		}
		td.innerHTML = a.outerHTML;
		html += td.outerHTML;
		const b = document.createElement('button');
		b.className = 'remove-forbid-button';
		b.id = 'forbid-' + key;
		b.innerText = 'Remove';
		html += '<td class="pull-right-button">' + b.outerHTML + '</td>';
		html += '</tr>';
	}
	html += '</table>';
	document.querySelector('#forbidList').innerHTML = html;
	document.querySelectorAll('.remove-forbid-button').forEach(removeButton => removeButton.addEventListener('click', removeForbidListEntry));
}

// Fetch current Twitch extension ID => name
fetchTwitchExtensions();

// Load current stored options
document.addEventListener('DOMContentLoaded', restoreOptions);

// Watch for changes
document.querySelector('#disable').addEventListener('change', saveOptions);
