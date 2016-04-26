<?php
    $file = file('data/PilotStudy.txt',FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $quizFile = file_get_contents('data/quiz.json', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    //echo sizeof($file);
    // foreach($file as $line){
    //     echo $line;
    // }
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <link href="css/index.css" rel="stylesheet" />
        <link href="css/d3canvas.css" rel="stylesheet" />
        <link href="css/jquery-ui.min.css" rel="stylesheet" />
        <script src="js/jquery-2.1.1.min.js"></script>
        <script src="js/jquery.highlight-5.js"></script>
        <script src="js/d3.min.js"></script>
        <script src="js/paper-full.min.js"></script>
        <script src="js/canvas.js"></script>
        <script src="js/parser.js"></script>
    </head>
<body>
    <div id="header">
    <h1>HyVideo</h1>
    </div>
    <div id="section">
        <div id="leftPanel">
        <video id="video" controls>
          <source src="video/example1.webm" type="video/webm">
          <source src="video/example1.mp4" type="video/mp4">
          <track src="video/src/example1.vtt" label="English subtitles" kind="subtitles" type="text/vtt" srclang='en' default></track>
        Your browser does not support the video tag.
        </video>
        <label>2-D Timeline</label>
        <canvas id='leftSub'></canvas>
        <button id="clear" onclick="buttonClick()">Clear</button>
        <button id="conceptsMapping" onclick="conceptsMapping()">Manual Concept-Map</button>
        <h3 id="clips"></h3>
        <button id="startQuiz" onclick="startQuiz()">Start Quiz!</button>
        <form action="php/grade.php" method="post" id="myForm" style="display:none">
              <label id='quizLabel'></label><br>
              <label id='quizContent'></label><br><br>
              <input type="radio" value="true" name="answer">True<br>
              <input type="radio" value="false" name="answer">False<br><br>
              <input type="submit" name="submit" value="submit">
        </form>
        <br/>
        <div id='footerButton'>  
            <br>      
            <label>Load Concept-Map:</label>
            <input type='file' id='file' name='userFile' accept=".json">
            <br/>
            <br/>
            <label>Download Concept-Map:</label>
            <a id='click' href="#">click</a>
        </div>
        </div>
        <div id="rightPanel" tabindex="0">
            <input type="text" class="inputText"/>
        </div>
    </div>
    <div id="footer">
    Copyright @ NUS-HCI
    </div>
    <script type="text/paperscript" canvas="leftSub">
        var background = new Path.Rectangle(0,5,paper.view.viewSize.width,10);
        background.style={
            fillColor: 'darkgray'
        };
    </script>
    <script>
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
          // Great success! All the File APIs are supported.
        } else {
          alert('The File APIs are not fully supported in this browser.');
        }
        paper.install(window);
        paper.setup('leftSub');
        var quiz = null;
        window.addEventListener("load", function() {
            setCanvas();
            greatNounList = <?php echo json_encode($file); ?>;
            quiz = <?php echo $quizFile; ?>;
            //console.log(quiz['video1']);
            //console.log(greatNounList);
        });

        $(".inputText").keyup(function (e) {
            if (e.keyCode == 13) {
                // Do something
                var inputText = $(".inputText").val();
                inputText = inputText.trim();
                if (selectedLinkObj) {
                    updateLinkLabelName(inputText);
                }
                else if (selectedNodeObj) {
                    updateNoteNodeWord(inputText);
                }
                else { console.log("No update while type enter in inputText."); }
            }
        });
        function setCanvas(){
            var canvasWidth = document.getElementById('rightPanel').offsetWidth;
            var canvasHeight = document.getElementById('rightPanel').offsetHeight;
            var canvasPositionX = $('#rightPanel').offset().left;
            var canvasPositionY = $('#rightPanel').offset().top;
            drawCanvas(canvasWidth,canvasHeight,canvasPositionX,canvasPositionY);//Draw the D3 layout to the page
        }
        function getConceptsFromSubtitles(){
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            var tmp = '';
            for(var i = 0; i < myCues.length; i++){
                localTextParsing(myCues[i].getCueAsHTML().textContent, myCues[i].startTime, myCues[i].endTime);
            }
        }
        function conceptsMapping(){
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            var tmp = '';
            for(var i = 0; i < myCues.length; i++){
                tmp += myCues[i].getCueAsHTML().textContent + ' ';
                //localTextParsing(myCues[i].getCueAsHTML().textContent, myCues[i].startTime, myCues[i].endTime);
            }
            //The below code to call external API for concept tagging, and the maximum call limit per day is 1000.
            //sendCuestoConceptTagging(tmp);

            //The below code is to show each substitle in the video
            for (var i = 0; i < myCues.length; i++) {
                myCues[i].onenter  = function(){ 
                    // console.log(this);
                    if(!this.show){
                        //document.getElementById("leftSub").innerHTML += ('<span>' + this.getCueAsHTML().textContent + '</span> <br/>');
                        //Technique 1: use the great noun list to match proper noun
                        localTextParsing(this.getCueAsHTML().textContent, this.startTime, this.endTime);
                    }
                };
                myCues[i].onexit = function(){  
                    this.show = true;
                };
            }
        }
        function buttonClick(){
            if(paper.project.layers.length != 1){
                paper.project.activeLayer.removeChildren();
                paper.project.view.update();
            }
            if(dragNodeObj){
                dragNodeObj.classed("dragged", dragNodeObj.data()[0].dragged = false);
                dragNodeObj = null;
            }
        }
        function drawTimeline(word, timeline){
            //console.log(paper.project);
            console.log("draw on the Timeline");
            //console.log(timeline);
            if(paper.project.layers.length != 1){
                paper.project.activeLayer.removeChildren();
            }
            new paper.Layer();
            var duration = document.getElementById("video").duration;
            var viewSize = paper.view.viewSize.width;
            console.log(duration);
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            timeline.forEach(function(timeStamp){
                var rect = new paper.Path.Rectangle(viewSize*timeStamp.startTime/duration,0,viewSize*(timeStamp.endTime - timeStamp.startTime)/duration,200);
                rect.style = {
                    fillColor: 'red'
                };
                rect.startTime = timeStamp.startTime;
                rect.word = word;
                for (var i = 0; i < myCues.length; i++) {
                    if(myCues[i].startTime == timeStamp.startTime && myCues[i].endTime == timeStamp.endTime){
                        rect.showCue = myCues[i].getCueAsHTML().textContent;
                        break;
                    }
                }
                rect.onClick = function(event){
                    this.fillColor = 'green';
                    console.log('startTime:' + this.startTime);
                    document.getElementById("video").currentTime = this.startTime;
                    document.getElementById("video").play();
                };
                rect.onMouseEnter = function(event){
                    console.log(this.word);
                    if(this.showCue){
                        $("#clips").text(this.showCue);
                        //hightlight text
                        var highlightText = this.word;
                        $("#clips").highlight(highlightText,"highlight");
                    }
                };
                rect.onMouseLeave = function(event){
                    $("#clips").text("");
                    $("#clips").removeHighlight();
                };
            });
            paper.project.view.update();
            console.log("Drawing is over");
        }

        $('#click').click(function(){ saveNoteToFile(); return false; });

        function handleFileSelect(evt) {
            console.log(evt);
            var file = evt.target.files[0]; // FileList object
            if(file){
                var reader = new FileReader();
                reader.readAsText(file);

                reader.onload = function(e){
                    var result = jQuery.parseJSON(reader.result);
                    if(result.node){
                        setNote(result);
                        evt.srcElement.value = null;
                    }
                    else{
                        alert('The input file format is incorrect!');
                    }
                    console.log(result);
                }
            }
        }
        document.getElementById('file').addEventListener('change', handleFileSelect, false);

        function saveNoteToFile (){
            var savedNote = saveNote();
            $.ajax({
                url : "php/SaveDataToCookies.php",
                type: "POST",
                data : {'name':'savedNote','data':savedNote},
                success: function(data, textStatus, jqXHR)
                {
                    //data - response from server
                    window.location.href = 'php/downloadSavedNote.php';
                    console.log(data);
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    alert('err in sending requests');
                }
            });
        }

        var quizNum = 0;
        var video = 'video1';

        function startQuiz(){
            $("#footerButton").css("display","none");
            $("#startQuiz").css("display","none");
            setForm();
            $("#myForm").css("display","inline");
        }


        function setForm() {
            if(quizNum == quiz[video].length)
                return false;
            else{
                $('#quizLabel').text(quiz[video][quizNum]['title']);
                $('#quizContent').text(quiz[video][quizNum]['content']);
                $("input:radio").removeAttr("checked");
                return true;
            }

        }

        $('#myForm').submit(function(e){
            e.preventDefault();
            var data = $("#myForm").serialize() + "&quiz=" + quizNum;
            $.ajax({
                url:$("#myForm").attr("action"),
                type:'post',
                data: data,
                success:function(response){
                    quizNum ++;
                    if(!setForm()){
                        $("#myForm").css("display","none");
                    }
                    console.log(response);
                    //console.log($("#myForm").serialize());
                    //whatever you wanna do after the form is successfully submitted
                }
            });
        });
    </script>
</body>
</html>
