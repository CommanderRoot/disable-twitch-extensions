"use strict";

// Debug console logging
const isDev = false;
// Default config
let config = {
	disable: 'all',
	allowList: {},
	forbidList: {},
};


function checkRequest(details) {
	if(isDev) console.log(details);

	if(config.disable === 'all') {
		if(isDev) console.log('Canceling extension requests: ' + details.url);
		return {cancel: true};
	} else if(config.disable === 'none') {
		// Do nothing if we disable none
		return;
	}

	const url = new URL(details.url);
	const extensionID = url.hostname.split('.', 2)[0];
	if(isDev) console.log(url);
	if(isDev) console.log(extensionID);

	if((config.disable === 'allowlist' || config.disable === 'forbidlist') && extensionID === 'supervisor') {
		// Allow supervisor
		return;
	} else if(config.disable === 'allowlist') {
		if(typeof config.allowList[extensionID] !== 'undefined' && config.allowList[extensionID] === true) {
			return;
		}
		if(isDev) console.log('Canceling extension requests for "' + extensionID + '" as it is not in the allowed list: ' + details.url);
		// Default forbid
		return {cancel: true};
	} else if(config.disable === 'forbidlist') {
		if(typeof config.forbidList[extensionID] !== 'undefined' && config.forbidList[extensionID] === true) {
			if(isDev) console.log('Canceling extension requests for "' + extensionID + '" as it is on the forbid list: ' + details.url);
			return {cancel: true};
		}
		// Default allow
		return;
	}

	// Do nothing if we get here for whatever reason
	return;
}

// Firefox
if(typeof browser !== 'undefined' && typeof browser.webRequest !== 'undefined') {
	// Load current settings
	let gettingSettings = browser.storage.sync.get();
	gettingSettings.then((data) => {
		if(typeof data.disable === 'string') {
			config.disable = data.disable;
		}
		if(typeof data.allowList === 'object') {
			config.allowList = data.allowList;
		}
		if(typeof data.forbidList === 'object') {
			config.forbidList = data.forbidList;
		}
	});

	// Add listener for http requests
	browser.webRequest.onBeforeRequest.addListener(
		checkRequest,
		{
			urls : [
				'https://*.ext-twitch.tv/*',
			],
		},
		['blocking']
	);

	// Listen for setting changes
	browser.storage.onChanged.addListener(function (changes, namespace) {
		for(let [key, { oldValue, newValue }] of Object.entries(changes)) {
			if(isDev) console.log(
				`Storage key "${key}" in namespace "${namespace}" changed.`,
				`Old value was "${oldValue}", new value is "${newValue}".`
			);

			if(key === 'disable') {
				config.disable = newValue;
			} else if(key === 'allowList') {
				config.allowList = newValue;
			} else if(key === 'forbidList') {
				config.forbidList = newValue;
			}
		}
	});
} else if(typeof chrome !== 'undefined' && typeof chrome.webRequest !== 'undefined') { // Chrome
	// Load current settings
	chrome.storage.sync.get({disable: 'all', allowList: {}, forbidList: {}}, (data) => {
		if(typeof data.disable === 'string') {
			config.disable = data.disable;
		}
		if(typeof data.allowList === 'object') {
			config.allowList = data.allowList;
		}
		if(typeof data.forbidList === 'object') {
			config.forbidList = data.forbidList;
		}
	});

	// Add listener for http requests
	chrome.webRequest.onBeforeRequest.addListener(
		checkRequest,
		{
			urls : [
				'https://*.ext-twitch.tv/*',
			],
		},
		['blocking']
	);

	// Listen for setting changes
	chrome.storage.onChanged.addListener(function (changes, namespace) {
		for(let [key, { oldValue, newValue }] of Object.entries(changes)) {
			if(isDev) console.log(
				`Storage key "${key}" in namespace "${namespace}" changed.`,
				`Old value was "${oldValue}", new value is "${newValue}".`
			);

			if(key === 'disable') {
				config.disable = newValue;
			} else if(key === 'allowList') {
				config.allowList = newValue;
			} else if(key === 'forbidList') {
				config.forbidList = newValue;
			}
		}
	});
}
