<?php
    require_once('AYLIEN/TextAPI.php');

    $session_name = $_POST['name'];
	$session_text = $_POST['text'];

    $textapi = new AYLIEN\TextAPI("c3d2e5d7", "8b01b98b519dd820eaf883f49dd4ed82", false);
    if($session_name == 'Concepts'){
    	$concepts = $textapi->Concepts(array("text" => $session_text, "language" => "en"));
    	$results = array();
    	foreach ($concepts->concepts as $uri => $value) {
	        $surfaceForms = array_map(function($sf) {
	        	return $sf->string;
	        }, $value->surfaceForms);
	        $results = array_merge($results, $surfaceForms);
        	//printf("Concept:    " . implode(",", $surfaceForms) . "<br />");
    	}
    	echo json_encode($results);
    }
?>