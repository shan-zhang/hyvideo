<?php 
	$cookie_name = "quiz-";
	$File = "HyVideoPilotStudyResult";
	$set = false;
	//$array = array();
	header("Content-Disposition: attachment; filename=\"" . basename($File) . "\"");
	header("Content-Type: application/force-download");
	header("Connection: close");

	foreach ($_COOKIE as $name => $value) {
	    if (stripos($name,$cookie_name) === 0) {
			    //array_push($array, $value);
	    		echo $value; 
	        	$set = true;
	    }
	}

	if (!$set) {
	    echo "There is no result stored in the study.";
	}
	else{
		//echo $array;
	}
?>