<?php 
	$cookie_name = "quiz-";
	$set = false;

	foreach ($_COOKIE as $name => $value) {
	    if (stripos($name,$cookie_name) === 0) {
	        	unset($_COOKIE[$name]);
				setcookie($name, null, time()-3600, '/');
	        	$set = true;
	    }
	}
	if (!$set) {
	    echo "<h3>Cookie named '" . $cookie_name . "*' is not set!</h3>";
	}
	else {

		echo "<h3>Clean the result Cookie.</h3>";
	}
?>