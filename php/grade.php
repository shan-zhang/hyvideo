<?php
    $quiz = $_POST['quiz'];
    $answer = $_POST['answer'];
    $time = $_POST['time'];
    $quizType = $_POST['quizType'];

    $cookie_name = "quiz-".$quizType.'-'.$quiz;
    $cookie_value = json_encode($_POST);
    setcookie($cookie_name, $cookie_value, time() + (86400 * 5), "/"); // 86400 = 1 day

    echo $cookie_value;
?>