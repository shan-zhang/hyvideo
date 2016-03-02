<?php
    $session_name = $_POST['name'];
	$session_text = $_POST['text'];
    $session_api = $_POST['API'];

    if($session_api == 'AYLIEN'){
        require_once('AYLIEN/TextAPI.php');
        $textapi = new AYLIEN\TextAPI("c3d2e5d7", "8b01b98b519dd820eaf883f49dd4ed82", false);
        if($session_name == 'Concepts'){
            $concepts = $textapi->Concepts(array("text" => $session_text, "language" => "en"));
            $results = array(); 
            foreach ($concepts->concepts as $uri => $value) {
                $surfaceForms = array_map(function($sf) {
                    return $sf->string;
                }, $value->surfaceForms);
                //$results  = array_merge($results, $surfaceForms);
                foreach ($surfaceForms as $conceptString) {
                    array_push($results, (object) array('url' => $uri, 'concept' => $conceptString));
                }
                //printf("Concept:    " . implode(",", $surfaceForms) . "<br />");
            }
            echo json_encode($results);
        }   
    }
    else if($session_api == 'AlchemyApi'){
        require_once('AlchemyApi/alchemyapi.php');
        $alchemyapi = new AlchemyAPI("c023b3df5d0a66ccc644a3137f498f0fccc3d304");
        if($session_name == 'Concepts'){
            $options = null;
            $options['outputMode'] = 'json';
            $response = $alchemyapi->concepts('text',$session_text,$options);
            echo json_encode($response);
        }
    }
    else{}
?>