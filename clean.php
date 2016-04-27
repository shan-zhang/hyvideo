<?php 
	$cookie_name = "result";
	if(!isset($_COOKIE[$cookie_name])) {
    	echo "<h3>Cookie named '" . $cookie_name . "' is not set!</h3>";
	} else {
		unset($_COOKIE[$cookie_name]);
		setcookie($cookie_name, null, time()-3600, '/');
		echo "<h3>Clean the result Cookie.</h3>";
	}
?>