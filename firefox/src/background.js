"use strict";

// Debug console logging
const isDev = false;
// Default config
const config = {
	disable: 'all',
	allowList: {},
	forbidList: {},
};
let knownTwitchExtensions = {};


function fetchKnownTwitchExtensions() {
	fetch('https://twitch-tools.rootonline.de/twitch_extensions.php', { cache: 'no-cache' })
		.then(response => response.json())
		.then(data => {
			if (isDev) console.log(data);
			knownTwitchExtensions = data;
		});
}

function reportUnknownExtension(extensionID) {
	if (isDev) console.log('Reporting extension "' + extensionID + '" as unknown');

	// Add extensionID to known array so we only report it once
	knownTwitchExtensions[extensionID] = true;

	// Do reporting HTTP request
	fetch('https://twitch-tools.rootonline.de/twitch_extensions.php', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'extensionID=' + encodeURIComponent(extensionID),
	})
		.then((response) => response.json())
		.then((data) => {
			if (isDev) console.log('Report success:', data);
		})
		.catch((error) => {
			if (isDev) console.error('Report error:', error);
			delete knownTwitchExtensions[extensionID];
		});
}

function checkRequest(details) {
	if (isDev) console.log(details);

	if (config.disable === 'all') {
		if (isDev) console.log('Canceling extension requests: ' + details.url);
		browser.tabs.insertCSS(details.tabId, {
			code: '.extension-panel, .extensions-dock__layout { display: none !important; }',
			runAt: 'document_start',
		});
		return { cancel: true };
	} else if (config.disable === 'none') {
		// Do nothing if we disable none
		return;
	}

	const url = new URL(details.url);
	const anchor = url.searchParams.get('anchor');
	const extensionID = url.hostname.split('.', 2)[0];
	if (isDev) console.log(url);
	if (isDev) console.log(extensionID);

	// Check if we know this extension already (and report if we don't)
	if (extensionID !== 'supervisor' && typeof knownTwitchExtensions[extensionID] === 'undefined' && Object.keys(knownTwitchExtensions).length > 0) {
		if (isDev) console.log('Extension with ID: "' + extensionID + '" is not known to us!');
		reportUnknownExtension(extensionID);
	}

	if ((config.disable === 'allowlist' || config.disable === 'forbidlist') && extensionID === 'supervisor') {
		// Allow supervisor
		return;
	} else if (config.disable === 'allowlist') {
		if (typeof config.allowList[extensionID] !== 'undefined' && config.allowList[extensionID] === true) {
			return;
		}

		if (isDev) console.log('Canceling extension requests for "' + extensionID + '" as it is not in the allowed list: ' + details.url);

		if (anchor === 'video_overlay' || anchor === 'component') {
			// Hide video overlay extension dock
			browser.tabs.insertCSS(details.tabId, {
				code: '.extensions-dock-card:has(img[src*="' + extensionID + '"]) { display: none !important; }',
				runAt: 'document_start',
			});
		} else if (anchor === 'panel') {
			// Hide panel
			browser.tabs.insertCSS(details.tabId, {
				code: '.extension-panel:has(a.tw-link[href*="' + extensionID + '"]) { display: none !important; }',
				runAt: 'document_start',
			});
		}
		// Default forbid
		return { cancel: true };
	} else if (config.disable === 'forbidlist') {
		if (typeof config.forbidList[extensionID] !== 'undefined' && config.forbidList[extensionID] === true) {
			if (isDev) console.log('Canceling extension requests for "' + extensionID + '" as it is on the forbid list: ' + details.url);

			if (anchor === 'video_overlay' || anchor === 'component') {
				// Hide video overlay extension dock
				browser.tabs.insertCSS(details.tabId, {
					code: '.extensions-dock-card:has(img[src*="' + extensionID + '"]) { display: none !important; }',
					runAt: 'document_start',
				});
			} else if (anchor === 'panel') {
				// Hide panel
				browser.tabs.insertCSS(details.tabId, {
					code: '.extension-panel:has(a.tw-link[href*="' + extensionID + '"]) { display: none !important; }',
					runAt: 'document_start',
				});
			}
			return { cancel: true };
		}
		// Default allow
		return;
	}

	// Do nothing if we get here for whatever reason
	return;
}


// Load current settings
const gettingSettings = browser.storage.sync.get();
gettingSettings.then((data) => {
	if (typeof data.disable === 'string') {
		config.disable = data.disable;
	}
	if (typeof data.allowList === 'object') {
		config.allowList = data.allowList;
	}
	if (typeof data.forbidList === 'object') {
		config.forbidList = data.forbidList;
	}
});

// Add listener for http requests
browser.webRequest.onBeforeRequest.addListener(
	checkRequest,
	{
		urls: [
			'https://*.ext-twitch.tv/*',
		],
	},
	['blocking']
);

// Listen for setting changes
browser.storage.onChanged.addListener((changes, namespace) => {
	for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
		if (isDev)
			console.log(
				`Storage key "${key}" in namespace "${namespace}" changed.`,
				'Old value was ' + JSON.stringify(oldValue) + ', new value is ' + JSON.stringify(newValue)
			);

		if (key === 'disable') {
			config.disable = newValue;
		} else if (key === 'allowList') {
			config.allowList = newValue;
		} else if (key === 'forbidList') {
			config.forbidList = newValue;
		}
	}
});


// Fetch currently known Twitch extensions
fetchKnownTwitchExtensions();
