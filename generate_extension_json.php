<?php
// äöü
echo 'Script started ...' . PHP_EOL;

$extensions = [];
if (file_exists(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json')) {
	$extensions = json_decode(file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json'), true);
}
$old_extensions_count = count($extensions);

$ch = curl_init('https://api.twitchinsights.net/v1/extension/list');
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Expect:']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_AUTOREFERER, false);
$curl_output = curl_exec($ch);
$curl_info = curl_getinfo($ch);
if ($curl_info['http_code'] !== 200) {
	echo 'HTTP error: ' . $curl_info['http_code'];
	echo $curl_output . PHP_EOL;
	exit();
}

$json_decode = json_decode($curl_output, true);
if ($json_decode === null) {
	echo 'JSON decode error' . PHP_EOL;
	exit();
}

foreach ($json_decode['ext'] as $extension) {
	$extensions[$extension['id']] = $extension['name'];
}


function extSort(string $a, string $b): int
{
	if ($a === $b) {
		return 0;
	}

	// If neither or if both are deprecated sort them a-z
	if ((str_starts_with($a, '[DEPRECATED] ') && str_starts_with($b, '[DEPRECATED] ')) || (!str_starts_with($a, '[DEPRECATED] ') && !str_starts_with($b, '[DEPRECATED] '))) {
		$cmp = [$a, $b];
		natcasesort($cmp);
		return current($cmp) === $a ? -1 : 1;
	}

	// If one of them is deprecated then sort the not one higher
	return str_starts_with($b, '[DEPRECATED] ') ? -1 : 1;
}

uasort($extensions, 'extSort');


file_put_contents(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json', json_encode($extensions, JSON_UNESCAPED_UNICODE));

$new_extensions_count = count($extensions);
echo 'Found ' . ($new_extensions_count - $old_extensions_count) . ' new extensions.' . PHP_EOL;

echo 'Done!' . PHP_EOL;
