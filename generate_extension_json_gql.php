<?php
// äöü
echo 'Script started ...'.PHP_EOL;

$extensions = [];
if(file_exists(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json')) {
	$extensions = json_decode(file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json'), true); 
}
$old_extensions_count = count($extensions);
$categories = [
	'cbca1847-6448-409d-a0e2-03e0076a6165', // Extensions for Games
	'd86ef964-5f30-441f-aff2-4eb824696656', // Schedule & Countdowns
	'5f90120d-be64-41a7-bc83-6ecc9ba10910', // Loyalty and Recognition
	'e02ee494-3e26-4f4d-8717-93ac5d7fa8b9', // Streamer Tools
	'f3d9ce3c-696d-4c6f-b623-e76c06e33f1d', // Viewer Engagement
	'eb89b9c9-7acc-4731-b5f1-41dbcd64bb12', // Music
	'51aa177b-797d-42bb-a8bc-b547551a650a', // Polling & Voting
	'bb7763ca-d2d5-4b97-b202-c4785b729681', // Games in Extensions
	'0d0392f0-f404-47ee-b1fd-bc3fb7fa9412', // Extensions On the Go
];

$ch = curl_init('https://gql.twitch.tv/gql');
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Expect:', 'Content-Type: application/json', 'Client-Id: kimne78kx3ncx6brgo4mv6wki5h1ko']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_AUTOREFERER, false);
curl_setopt($ch, CURLOPT_POST, true);

foreach($categories as $category) {
	echo 'Doing category '.$category.' ...'.PHP_EOL;
	$cursor = '';

	do {
		$post_array = [
			'operationName' => 'ExtensionCategoryPage',
			'variables' => [
				'categoryID' => $category,
				'includeCurrentUser' => true,
			],
			'extensions' => [
				'persistedQuery' => [
					'version' => 1,
					'sha256Hash' => '4688bb3a8f5b4394d48fb9d8088966f190a1a73dd9fbe4b89d40e4f188fa978a',
				],
			],
		];
		if(!empty($cursor)) {
			$post_array['variables']['afterCursor'] = $cursor;
		}
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_array, JSON_UNESCAPED_UNICODE));

		echo 'Cursor: '.$cursor.PHP_EOL;
		$curl_output = curl_exec($ch);
		$curl_info = curl_getinfo($ch);
		if($curl_info['http_code'] != 200) {
			echo 'HTTP error: '.$curl_info['http_code'];
			echo $curl_output.PHP_EOL;
			exit();
		}

		$json_decode = json_decode($curl_output, true);
		if($json_decode === null) {
			echo 'JSON decode error'.PHP_EOL;
			exit();
		}

		if(!isset($json_decode['data'], $json_decode['data']['extensionCategory'], $json_decode['data']['extensionCategory']['extensions'], $json_decode['data']['extensionCategory']['extensions']['edges'])) {
			$cursor = '';
			echo $curl_output.PHP_EOL;
			// exit();
		} else {
			foreach($json_decode['data']['extensionCategory']['extensions']['edges'] as $extension) {
				$cursor = $extension['cursor'];
				$extensions[$extension['node']['clientID']] = $extension['node']['name'];
			}

			// Set cursor empty if we didn't have any extensions in this request
			if(count($json_decode['data']['extensionCategory']['extensions']['edges']) == 0) {
				$cursor = '';
			}
		}

	} while(!empty($cursor));
}

asort($extensions, SORT_NATURAL);

file_put_contents(__DIR__ . DIRECTORY_SEPARATOR . 'twitch_extensions.json', json_encode($extensions, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));

$new_extensions_count = count($extensions);
echo 'Found '.($new_extensions_count - $old_extensions_count).' new extensions.'.PHP_EOL;

echo 'Done!'.PHP_EOL;
