<?php
// äöü
echo 'Script started ...' . PHP_EOL;

$extensions = [];
if (file_exists(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json')) {
	$extensions = json_decode(file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json'), true);
}
$updated_extensions_count = 0;


$ch = curl_init('https://gql.twitch.tv/gql');
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
	'Expect:',
	'Content-Type: application/json',
	'Client-Id: kimne78kx3ncx6brgo4mv6wki5h1ko',
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_AUTOREFERER, false);
curl_setopt($ch, CURLOPT_POST, true);


foreach ($extensions as $extensionID => $extensionName) {
	echo 'Doing extension ' . $extensionName . ' (' . $extensionID . ') ...' . PHP_EOL;

	// if (str_starts_with($extensionName, '[DEPRECATED] ')) continue;

	$post_array = [
		'operationName' => 'ExtensionDetailsPage',
		'variables' => [
			'extensionID' => $extensionID,
			'isLoggedIn' => false,
		],
		'extensions' => [
			'persistedQuery' => [
				'version' => 1,
				'sha256Hash' => 'd461acfd6bb2418a062776b27627137537856fe700f5c6d972de4c90841edb16',
			],
		],
	];
	curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_array, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

	$curl_output = curl_exec($ch);
	$curl_info = curl_getinfo($ch);
	if ($curl_info['http_code'] !== 200) {
		echo 'HTTP error: ' . $curl_info['http_code'];
		echo $curl_output . PHP_EOL;
		break;
	}

	$json_decode = json_decode($curl_output, true);
	if ($json_decode === null) {
		echo 'JSON decode error: ' . json_last_error_msg() . PHP_EOL;
		break;
	}

	if (isset($json_decode['data'], $json_decode['data']['extension'], $json_decode['data']['extension'])) {
		if ($extensionID !== $json_decode['data']['extension']['clientID']) {
			echo 'Extension IDs do not match!' . PHP_EOL;
			break;
		}

		if ($extensionName !== $json_decode['data']['extension']['name']) {
			$extensions[$extensionID] = $json_decode['data']['extension']['name'];
			++$updated_extensions_count;
			echo '^ Updated name!' . PHP_EOL;
		}
	} else {
		echo '^ Not found!' . PHP_EOL;
		if (!str_starts_with($extensionName, '[DEPRECATED] ')) {
			$extensions[$extensionID] = '[DEPRECATED] ' . $extensions[$extensionID];
			++$updated_extensions_count;
		}
	}
}


function extSort(string $a, string $b): int
{
	global $extensions;

	// Sort by extension ID if the names are the same
	if ($extensions[$a] === $extensions[$b]) {
		$cmp = [$a, $b];
		natcasesort($cmp);
		return current($cmp) === $a ? -1 : 1;
	}

	// If neither or if both are deprecated sort them a-z
	if ((str_starts_with($extensions[$a], '[DEPRECATED] ') && str_starts_with($extensions[$b], '[DEPRECATED] ')) ||
		(!str_starts_with($extensions[$a], '[DEPRECATED] ') && !str_starts_with($extensions[$b], '[DEPRECATED] '))
	) {
		$cmp = [$extensions[$a], $extensions[$b]];
		natcasesort($cmp);
		return current($cmp) === $extensions[$a] ? -1 : 1;
	}

	// If one of them is deprecated then sort the not one higher
	return str_starts_with($extensions[$b], '[DEPRECATED] ') ? -1 : 1;
}

uksort($extensions, 'extSort');


file_put_contents(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json', json_encode($extensions, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo 'Updated ' . $updated_extensions_count . ' extensions.' . PHP_EOL;

echo 'Done!' . PHP_EOL;
