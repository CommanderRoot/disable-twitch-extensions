"use strict";

// Debug console logging
const isDev = false;
// Default config
const config = {
	disable: 'all',
	allowList: {},
	forbidList: {},
};


async function setupDeclarativeNetRequest() {
	// Get current ruleIDs
	const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
	if (isDev) console.log('Current rules:', currentRules);

	let ruleID = 1;
	let updateRuleOptions = {};

	// Remove all current rules
	if (currentRules.length > 0) {
		let currentRuleIDs = [];
		currentRules.forEach(rule => currentRuleIDs.push(rule.id));
		updateRuleOptions['removeRuleIds'] = currentRuleIDs;
	}

	if (config.disable === 'all' || config.disable === 'allowlist') {
		// Block all requests
		const rule = {
			id: ruleID++,
			action: {
				type: 'block',
			},
			condition: {
				urlFilter: '*.ext-twitch.tv/*',
			},
			priority: 1,
		};
		updateRuleOptions['addRules'] = [rule];
	}

	if (config.disable === 'allowlist') {
		// Allow supervisor
		const rule = {
			id: ruleID++,
			action: {
				type: 'allow',
			},
			condition: {
				urlFilter: '||supervisor.ext-twitch.tv/*',
			},
			priority: 2,
		};
		updateRuleOptions['addRules'].push(rule);

		// Allow each extension on the allowList
		Object.keys(config.allowList).forEach(extensionID => {
			const rule = {
				id: ruleID++,
				action: {
					type: 'allow',
				},
				condition: {
					urlFilter: '||' + extensionID + '.ext-twitch.tv/*',
				},
				priority: 2,
			};
			updateRuleOptions['addRules'].push(rule);
		});
	} else if (config.disable === 'forbidlist') {
		updateRuleOptions['addRules'] = [];

		// Block each extension on the forbidlist
		Object.keys(config.forbidList).forEach(extensionID => {
			const rule = {
				id: ruleID++,
				action: {
					type: 'block',
				},
				condition: {
					urlFilter: '||' + extensionID + '.ext-twitch.tv/*',
				},
				priority: 2,
			};
			updateRuleOptions['addRules'].push(rule);
		});
	}

	if (isDev) console.log('New rules:', updateRuleOptions);

	// Update ruleset
	if (Object.keys(updateRuleOptions).length > 0) {
		chrome.declarativeNetRequest.updateDynamicRules(
			updateRuleOptions
		);
	}
}


// Load current settings
chrome.storage.sync.get({ disable: 'all', allowList: {}, forbidList: {} }, (data) => {
	if (typeof data.disable === 'string') {
		config.disable = data.disable;
	}
	if (typeof data.allowList === 'object') {
		config.allowList = data.allowList;
	}
	if (typeof data.forbidList === 'object') {
		config.forbidList = data.forbidList;
	}

	// Setup declarativeNetRequest config
	setupDeclarativeNetRequest();
});


// Listen for setting changes
chrome.storage.onChanged.addListener((changes, namespace) => {
	for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
		if (isDev)
			console.log(
				`Storage key "${key}" in namespace "${namespace}" changed.`,
				`Old value was "${oldValue}", new value is "${newValue}".`
			);

		if (key === 'disable') {
			config.disable = newValue;
		} else if (key === 'allowList') {
			config.allowList = newValue;
		} else if (key === 'forbidList') {
			config.forbidList = newValue;
		}
	}

	// Update declarativeNetRequest config
	setupDeclarativeNetRequest();
});
