<?php
    $file = file('data/PilotStudyVideo1&3.txt',FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $quizFile = file_get_contents('data/quiz.json', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    //echo sizeof($file);
    // foreach($file as $line){
    //     echo $line;
    // }

    $showVideo = "practice";
    //$showVideo = "video1";
    //$showVideo = "video3";

    $videoName = 'video/video1.mp4';
    $videoSubtitle = 'video/src/video1.vtt';

?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <link href="css/index.css" rel="stylesheet" />
        <link href="css/d3canvas.css" rel="stylesheet" />
        <link href="css/jquery-ui.min.css" rel="stylesheet" />
        <script src="js/jquery-2.1.1.min.js"></script>
        <script src="https://code.jquery.com/ui/1.12.0/jquery-ui.js"></script>
        <script src="js/jquery.highlight-5.js"></script>
        <script src="js/d3.min.js"></script>
        <script src="js/paper-full.min.js"></script>
        <script src="js/canvas.js"></script>
        <script src="js/parser.js"></script>
    </head>
<body>
    <div id="header">
        <stan style='font-size: 25px'>MapVideo - Navigation Mode</stan>
    </div>
    <div id="section">
        <div id="leftPanel">
            <video id="video" controls>
                <!-- <source src="video/example1.webm" type="video/webm"> -->
                <!-- <source src="video/example1.mp4" type="video/mp4"> -->
                <!-- <track src="video/src/example1.vtt" label="English subtitles" kind="subtitles" type="text/vtt" srclang='en' default></track> -->
                
                <source src="<?php echo $videoName; ?>" type="video/mp4">
                <track src="<?php echo $videoSubtitle; ?>" label="English subtitles" kind="subtitles" type="text/vtt" srclang='en' default></track>
                Your browser does not support the video tag.
            </video>
            <div id="draggable" class="video-overlay">
                Concept Name:<input type='text'></input>
                <br />
                <br />
                <div>
                    <button onclick="saveStartTime()">Start time</button>&nbsp;&nbsp;<label id='startTime'></label>
                </div>
                <br />
                <div>
                    <button onclick="saveEndTime()">End time</button>&nbsp;&nbsp;<label id='endTime'></label>
                </div>
                <br />
                <div>
                    <button onclick="createTime()">Create time</button>&nbsp;&nbsp;<label id='createTime'></label>
                </div>
                <br />
                Concept description:<textarea rows='4' cols='25'></textarea>
                <br />
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button onclick='saveEdit()'>Save</button>&nbsp;&nbsp;<button onclick='discardEdit()'>Discard</button>
            </div>
            <label>2-D Timeline</label>
            <canvas id='leftSub'></canvas>
            <button id="clear" onclick="clearTimeStamp()">Clear</button>
            <!-- <button id="hideVideo" onclick="hideVideo()">Hide Video</button> -->
            <button id="conceptsMapping" onclick="clickConceptMap()">Auto-Concepts: off</button>
            <h3 id="clips"></h3>
            <!-- The code below is for quiz -->
            <!-- <button id="startQuiz" onclick="startQuiz(event)">Start Quiz!</button> -->
    <!--         <form action="php/grade.php" method="post" id="myForm" style="display:none">
                  <label id='quizLabel'></label><br>
                  <label id='quizContent'></label><br><br>
                  <div id='quizRadio' style="display:none">
                      <input type="radio" value="true" name="answer">True<br>
                      <input type="radio" value="false" name="answer">False<br><br>
                      <input type="submit" name="submit" value="submit">
                  </div>
            </form>
            <button id='radioOption' onclick="showRadio(event)" style="display:none">Ready!</button>
            <br/>
            <h3 id="closingQuiz" style="display:none">The quiz is over. Thanks for participating. <a href='download.php' onclick="downloadResult()">Download</a>the study result.</h3> -->

            <div id='footerButton'>
                <label>Suggested Key Concepts:</label>
                <br />
                <br />
                <div id='keyconcepts'></div>
                <br />
                <br />
                <label>Load Concept-Map:</label>
                <input type='file' id='file' name='userFile' accept=".json">
                <label>Download Concept-Map:</label>
                <a id='click' href="#">click</a>
                <br />
                <br />
                <button id="mapAllconcepts" onclick="mapAllconcepts()">Auto-All Concepts</button>
                <button id="centerConcept" onclick="clicktoCenter()">Auto-Center: off</button>
                <button id="autoPlayByClick" onclick="autoPlayByClicking()">AutoPlay-by-clicking: off</button>
                <button id="conceptPath" onclick="setConceptPath()">Concept-Path: off</button>
                <button id="releaseNodes" onclick="releaseNodes()">Release Nodes</button>
            </div>
        </div>
        <div id="rightPanel">
            <div id="subtitle"></div>
            <div id="draggableSearch">
                Search: <input type="text" id='searchText'></input><button onclick="hideSearch()">x</button>
            </div>
            <div id="rightPanelDown" ondrop="drop(event)" ondragover="allowDrop(event)">
                <input type="text" class="inputText"/>
            </div>
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
        var circle = null;
        var quiz = null;
        var mappingAllSubtitles = true;
        var mappingSingleSubtitle = false;
        var clickNodetoCenter = false;
        var autoPlayByClick = false;
        var conceptPath = false;
        var isPrintAllconceptNames = false;
        window.addEventListener("load", function() {
            setCanvas();
            greatNounList = <?php echo json_encode($file); ?>;
            quiz = <?php echo $quizFile; ?>;

            //The code below is to add the subtitle player
            subtitlePlayer();

            //The code below is to extract key concepts from substitles using third-party APY
            extractKeyConceptsFromSubtitles();

            $("#draggable").draggable();
            $("#draggableSearch").draggable();

            $(document).on("keydown", function (e) {
                if (e.which === 8 && !$(e.target).is('input') && !$(e.target).is('textarea')) {// keycode 8 for backspace
                    e.preventDefault();
                }
                if(e.which === 70 && e.ctrlKey){
                    e.preventDefault();
                    $("#searchText").val('');
                    document.getElementById('draggableSearch').style.visibility = 'visible';
                    $("#searchText").focus();
                }
                if(e.which === 32 && !$(e.target).is('input') && !$(e.target).is('textarea')){
                    if(document.getElementById("video").paused){
                        document.getElementById("video").play();
                    }
                    else{
                        document.getElementById("video").pause()
                    }
                    e.preventDefault();
                }
            });
        });

        $("video").click(function(e){
            if(document.getElementById("video").paused){
                document.getElementById("video").play();
            }
            else{
                document.getElementById("video").pause()
            }
            e.preventDefault();
        });

        $(".inputText").keyup(function (e) {
            if (e.keyCode == 13) {
                // Do something
                var inputText = $(".inputText").val();
                inputText = inputText.trim();
                if (selectedLinkObj && editLinkName) {
                    updateLinkLabelName(inputText);
                }
                else { console.log("No update while type enter in inputText."); }
            }
        });

        $("#searchText").keyup(function (e) {
             $("#rightPanelDown").removeHighlight();
            var searchText = $("#searchText").val();
            searchText = searchText.trim();
            if(searchText != ''){
                nodes.forEach(function (nodeItem){
                    if(nodeItem.word.toLowerCase() == searchText.toLowerCase()){
                        d3.selectAll('.node').filter(function(d){
                            return (d == nodeItem);
                        })
                        .classed("searched", nodeItem.searched = true);
                    }
                    else{
                        d3.selectAll('.node').filter(function(d){
                            return (d == nodeItem);
                        }).classed("searched", nodeItem.searched = false);                       
                    }
                });
            }
            else{
                nodes.forEach(function (nodeItem){
                    if(nodeItem.searched){
                        d3.selectAll('.node').filter(function(d){
                            return (d == nodeItem);
                        }).classed("searched", nodeItem.searched = false);
                    }
                });
            }
        });

        function saveStartTime(){
            var startTime = document.getElementById("video").currentTime;
            $("#draggable").find("#startTime").attr('time', startTime);
            $("#draggable").find("#startTime").text(Math.floor(startTime/60) + " min: "+ Math.floor((startTime - Math.floor(startTime/60) * 60)) + " sec");
        }

        function saveEndTime(){
            var endTime = document.getElementById("video").currentTime;
            $("#draggable").find("#endTime").attr('time', endTime);
            $("#draggable").find("#endTime").text(Math.floor(endTime/60) + " min: "+ Math.floor((endTime - Math.floor(endTime/60) * 60)) + " sec");
        }

        function createTime(){
            var createTime = document.getElementById("video").currentTime;
            $("#draggable").find("#createTime").attr('time', createTime);
            $("#draggable").find("#createTime").text(Math.floor(createTime/60) + " min: "+ Math.floor((createTime - Math.floor(createTime/60) * 60)) + " sec");

            circle.position = new Point(circle.viewSize*createTime/document.getElementById("video").duration,circle.y);
            circle.createTime = createTime;
            circle.showCue = '';
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            for (var i = 0; i < myCues.length; i++) {
                if(createTime >= myCues[i].startTime && createTime <= myCues[i].endTime){
                    circle.showCue += myCues[i].getCueAsHTML().textContent + ' ';
                    break;
                }
            }
            paper.project.view.update();
        }

        function saveEdit(){
            var startTime = $("#draggable").find("#startTime").attr('time');
            var endTime = $("#draggable").find("#endTime").attr('time');
            var createTime = $("#draggable").find("#createTime").attr('time');
            var word = $("#draggable").find("input").val();
            word = word.trim();
            var description = $("#draggable").find("textarea").val();
            description = description.trim();
            var manualVideoTime = [];
            if (selectedNodeObj && word != '') {
                if(startTime != null && endTime != null){
                    endTime = Math.max(startTime,endTime);
                    startTime = Math.min(startTime,endTime);
                    if(endTime){
                        //If both startTime and endTime equal to 00:00, this video time stamp will not be marked.
                        manualVideoTime.push({"startTime":startTime, "endTime":endTime});
                    }
                }
                if(description != ''){
                    selectedNodeObj.description = description;
                }

                selectedNodeObj.createTime = createTime;
                updateConceptName(word,manualVideoTime);
            }
            else{
                window.alert('Please do not leave the blank for the concept name');
            }

        }

        function discardEdit(){
            document.getElementById('draggable').style.visibility = 'hidden';
        }

        function hideSearch(){
            nodes.forEach(function (nodeItem){
                if(nodeItem.searched){
                    d3.selectAll('.node').filter(function(d){
                        return (d == nodeItem);
                    }).classed("searched", nodeItem.searched = false);
                }
            });
            document.getElementById('draggableSearch').style.visibility = 'hidden';
        }

        function setCanvas(){
            var canvasWidth = document.getElementById('rightPanelDown').offsetWidth;
            var canvasHeight = document.getElementById('rightPanelDown').offsetHeight;
            var canvasPositionX = $('#rightPanelDown').offset().left;
            var canvasPositionY = $('#rightPanelDown').offset().top;
            drawCanvas(canvasWidth,canvasHeight,canvasPositionX,canvasPositionY);//Draw the D3 layout to the page
        }

        function extractKeyConceptsFromSubtitles(){//Extract key concepts from the subtitles using API
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            var tmp = '';
            for(var i = 0; i < myCues.length; i++){
                tmp += myCues[i].getCueAsHTML().textContent + ' ';
            }
            //The below code is to call external API for concept tagging, and the maximum call limit per day is 1000.
            sendCuestoConceptTagging(tmp);
        }

        function hideVideo(){
            var video = document.getElementById("video");
            if(video.style.visibility == '' || video.style.visibility == 'visible'){
                video.style.visibility = "hidden";
                video.muted = true;
            }
            else{
                var person = prompt("Please enter your password to show the video");
                if (person != null) {
                    if(person == 'hyvideo'){
                        video.style.visibility = "visible";
                        video.muted = false;
                    }
                }
            }
        }

        function allowDrop(event) {
            event.preventDefault();
        }

        function drop(event) {
            event.preventDefault();
            var data = event.dataTransfer.getData("text");
            if(data){            
                var punctuationless = (data.trim()).replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '');
                var cleanData = punctuationless.replace(/\s{2,}/g, " ");
                //var id = event.dataTransfer.getData("id");
                if(cleanData != '' && cleanData.length <= 30){
                    console.log(cleanData.length);
                    //---The code below is to add draged text as text node to the canvas
                    // var node = document.createElement("LI");                 // Create a <li> node
                    // var textnode = document.createTextNode(data);   // Create a text node
                    // node.appendChild(textnode); 
                    // $(event.target).before(node);
                    var localJson = [];
                    localJson.push({"word": cleanData, "frequency": 1, 'video':[], "createTime":document.getElementById("video").currentTime});
                    AddConcept(JSON.stringify(localJson));
                }
            }
        }

        function scrollToSubtitle(id){ // To-do: scrollTop has no supporting for negative values. If we want to put the first few subtitles into the center, we probably need to fill in empty lines before the first subtitle.
            var scrollID = '#'+id;
            var scrollSpeed = 400;
            $('#subtitle').animate({ 
                scrollTop: $('#subtitle').scrollTop() + ($(scrollID).position().top - $('#subtitle').position().top) - $('#subtitle').height()/2 + $(scrollID).height()/2
            }, scrollSpeed);
        }

        function subtitlePlayer(){
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            //The code below is to show all subtitiles one by one in the subtitle DIV tag
            for(var i = 0; i < myCues.length; i++){
                myCues[i].id = i;
                myCues[i].onenter  = function(){
                    var startTime = this.startTime;
                    var endTime = this.endTime;
                    var cueItem = this;
                    scrollToSubtitle(cueItem.id);
                    $('#'+cueItem.id).css('background-color','lightgray');
                    var pantoCenterNode = null;
                    nodes.forEach(function (nodeItem){
                        if(nodeItem.createTime >= startTime && nodeItem.createTime <= endTime){
                            if(pantoCenterNode){
                                if(pantoCenterNode.createTime < nodeItem.createTime){
                                    pantoCenterNode = nodeItem;
                                }
                            }
                            else
                                pantoCenterNode = nodeItem;

                            d3.selectAll('.node').filter(function(d){
                                return (d == nodeItem);
                            })
                            .classed("conceptPathed", nodeItem.conceptPathed = true)
                            .classed("highlighted", nodeItem.highlighted = false);
                        }
                        else{
                            var punctuationless = (cueItem.getCueAsHTML().textContent.trim()).replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '');
                            var cleanString = punctuationless.replace(/\s{2,}/g, " ");
                            if(cueItem.getCueAsHTML().textContent.search(new RegExp(nodeItem.word, "i")) != -1 || cleanString.search(new RegExp(nodeItem.word, "i")) != -1){
                                //Highlight the nodes that are being discussed
                                d3.selectAll('.node').filter(function(d){
                                    return (d == nodeItem);
                                })
                                .classed("conceptPathed", nodeItem.conceptPathed = false)
                                .classed("highlighted", nodeItem.highlighted = true);
                            }
                            else{
                                //Unhighlighting the nodes that are not being discussed
                                d3.selectAll('.node').filter(function(d){
                                    return (d == nodeItem);
                                })
                                .classed("conceptPathed", nodeItem.conceptPathed = false)
                                .classed("highlighted", nodeItem.highlighted = false);
                            }
                        }
                    });

                    if(pantoCenterNode){
                        console.log('center to :' + pantoCenterNode.word);
                        var selection = d3.selectAll('.node').filter(function(d){
                            return (d == pantoCenterNode);
                        });
                        pantoCentre(selection, pantoCenterNode, 1500);
                    }

                    if(mappingSingleSubtitle && !this.show){
                        localTextParsing(this.getCueAsHTML().textContent, startTime, endTime);
                        this.show = true;
                    }

                    tick(startTime, endTime);
                };
                myCues[i].onexit = function(){
                    var cueItem = this;
                    $('#'+cueItem.id).css('background-color','white');
                    tick();
                };
                var node = document.createElement("li");                 // Create a <li> node
                node.setAttribute('id',i);
                var textnode = document.createTextNode(myCues[i].getCueAsHTML().textContent);   // Create a text node
                node.appendChild(textnode);                              // Append the text to <li>
                node.onclick = clickSubtitles;
                node.startTime = myCues[i].startTime;
                node.endTime = myCues[i].endTime;
                document.getElementById('subtitle').appendChild(node);
                          
            }
        }

        function clicktoCenter(){
            clickNodetoCenter = !clickNodetoCenter;
            if(clickNodetoCenter){
                $('#centerConcept').html('Auto-Center: On');
            }
            else
                $('#centerConcept').html('Auto-Center: off');
        }

        function setConceptPath(){
            conceptPath = !conceptPath;
            if(conceptPath){
                $('#conceptPath').html('Concept-Path: On');
                drawConceptPath();
                svg.selectAll('.info').attr('opacity',0.8);
            }
            else{
                $('#conceptPath').html('Concept-Path: off');
                drawConceptPath();
                svg.selectAll('.info').attr('opacity',0);
            }
        }

        function clickConceptMap(){
            mappingSingleSubtitle = !mappingSingleSubtitle;
            if(mappingSingleSubtitle){
                $('#conceptsMapping').html('Auto-Concepts: On');
            }
            else
                $('#conceptsMapping').html('Auto-Concepts: Off');
        }

        function autoPlayByClicking(){
            autoPlayByClick = !autoPlayByClick;
            if(autoPlayByClick){
                $('#autoPlayByClick').html('AutoPlay-by-clicking: on');
            }
            else
                $('#autoPlayByClick').html('AutoPlay-by-clicking: off');
        }

        function mapAllconcepts(){
            if(mappingAllSubtitles){
                var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
                var myCues = myTrack.cues;   // get list of cues 
                //The below code is to show concepts of all substitles in the video
                var tmp = '';
                for(var i = 0; i < myCues.length; i++){
                    tmp += myCues[i].getCueAsHTML().textContent + ' ';
                    localTextParsing(myCues[i].getCueAsHTML().textContent, myCues[i].startTime, myCues[i].endTime);
                }

                if(isPrintAllconceptNames)
                    setTimeout(printAllConceptNames, 2000);
            }            
        }

        function clickSubtitles(event){
            if(event.ctrlKey || event.altKey){
                console.log(this.id);
                document.getElementById("video").currentTime = this.startTime;
                document.getElementById("video").play();
            }
        }

        function clearTimeStamp(){
            resetTimeline();
            unselectNode();
            unselectLink();
        }

        function resetTimeline(){
            if(paper.project.layers.length != 1){
                paper.project.activeLayer.removeChildren();
                paper.project.view.update();
            }
        }

        function drawLinkToTimeline(source, target){
            console.log('Show link in the video');
            resetTimeline();
            new paper.Layer();
            var duration = document.getElementById("video").duration;
            var viewSize = paper.view.viewSize.width;
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues
            for (var i = 0; i < myCues.length; i++) {
                var myCueItem = myCues[i];
                var inSouceVideo = false;
                var inTargetVideo = false;
                source.video.forEach(function(videoSItem){
                    if(videoSItem.startTime == myCueItem.startTime && videoSItem.endTime == myCueItem.endTime)
                            inSouceVideo = true;
                })
                target.video.forEach(function(videoTItem){
                    if(videoTItem.startTime == myCueItem.startTime && videoTItem.endTime == myCueItem.endTime)
                            inTargetVideo = true;
                })
                if(inSouceVideo && inTargetVideo){
                    var rect = new paper.Path.Rectangle(viewSize*myCueItem.startTime/duration,0,viewSize*(myCueItem.endTime - myCueItem.startTime)/duration,200);
                    rect.style = {
                        fillColor: 'blue'
                    };
                    rect.startTime = myCueItem.startTime;
                    rect.sWord = source.word;
                    rect.tWord = target.word;
                    rect.showCue = myCueItem.getCueAsHTML().textContent;

                    rect.onClick = function(event){
                        this.fillColor = 'green';
                        //console.log('startTime:' + this.startTime);
                        document.getElementById("video").currentTime = this.startTime;
                        document.getElementById("video").play();
                    };
                    rect.onMouseEnter = function(event){
                        if(this.showCue){
                            $("#clips").text(this.showCue);
                            //hightlight text
                            $("#clips").highlight(this.sWord,"highlight");
                            $("#clips").highlight(this.tWord,"highlight");
                        }
                    };
                    rect.onMouseLeave = function(event){
                        $("#clips").text("");
                        $("#clips").removeHighlight();
                    };
                }
            }

            paper.project.view.update();
            console.log("Drawing Link in video is over");
        }

        function drawTimeline(word, timeline, createTime){
            console.log("draw concepts on the Timeline");
            resetTimeline();
            new paper.Layer();
            var duration = document.getElementById("video").duration;
            var viewSize = paper.view.viewSize.width;
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            timeline.forEach(function(timeStamp){
                var rect = new paper.Path.Rectangle(viewSize*timeStamp.startTime/duration,0,viewSize*(timeStamp.endTime - timeStamp.startTime)/duration,200);
                rect.style = {
                    fillColor: 'red'
                };
                rect.startTime = timeStamp.startTime;
                rect.word = word;
                rect.showCue = '';
                for (var i = 0; i < myCues.length; i++) {
                    if(myCues[i].startTime >= timeStamp.startTime && myCues[i].endTime <= timeStamp.endTime){
                        rect.showCue += myCues[i].getCueAsHTML().textContent + ' ';
                        //break;
                    }
                }
                rect.onClick = function(event){
                    this.fillColor = 'green';
                    document.getElementById("video").currentTime = this.startTime;
                    document.getElementById("video").play();
                };
                rect.onMouseEnter = function(event){
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

            circle = new paper.Path.Circle(new Point(viewSize*createTime/duration,10),8);
            circle.viewSize = viewSize;
            circle.y = 10;
            circle.style = {
                fillColor: 'blue'
            };
            circle.word = word;
            circle.showCue = '';
            circle.createTime = createTime;
            for (var i = 0; i < myCues.length; i++) {
                if(createTime >= myCues[i].startTime && createTime <= myCues[i].endTime){
                    circle.showCue += myCues[i].getCueAsHTML().textContent + ' ';
                    break;
                }
            }
            circle.onClick = function(event){
                document.getElementById("video").currentTime = this.createTime;
                document.getElementById("video").play();
            };
            circle.onMouseEnter = function(event){
                if(this.showCue){
                    $("#clips").text(this.showCue);
                    //hightlight text
                    var highlightText = this.word;
                    $("#clips").highlight(highlightText,"highlight");
                }
            };
            circle.onMouseLeave = function(event){
                $("#clips").text("");
                $("#clips").removeHighlight();
            };
            paper.project.view.update();
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
                        document.getElementById('conceptsMapping').style.visibility = 'hidden';
                    }
                    else{
                        alert('The input file format is incorrect!');
                    }
                    //console.log(result);
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
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    alert('err in sending requests');
                }
            });
        }
        var quizNum = 0;
        var quizTask = {'pre': "<?php echo 'pre-'.$showVideo; ?>",'post': "<?php echo 'post-'.$showVideo; ?>" };
        var quizType = 'pre';
        var quizTime;
        function startQuiz(e){
            $("#footerButton").css("display","none");
            $("#startQuiz").css("display","none");
            setForm();
            $("#myForm").css("display","inline");
            $('#radioOption').css("display","inline");
        }

        function setForm() {
            if(quizNum == quiz[quizTask[quizType]].length)
                return false;
            else{
                $('#quizLabel').text(quiz[quizTask[quizType]][quizNum]['title']);
                $('#quizContent').text(quiz[quizTask[quizType]][quizNum]['content']);
                $('#quizRadio').css("display","none");
                $('#radioOption').css("display","inline");
                return true;
            }

        }

        function showRadio(e){
            quizTime = e.timeStamp;
            $('#radioOption').css("display","none");
            $('#quizRadio').css("display","inline");
        }

        function downloadResult(){
            console.log("Downloading results...");
            if(quizType == 'pre'){
                quizType = 'post';
                quizNum = 0;
                $("#closingQuiz").css("display","none");
                $("#startQuiz").css("display","inline");
            }
        }

        $('#myForm').submit(function(e){
            e.preventDefault();
            var timePerQuiz = e.timeStamp - quizTime;
            var data = $("#myForm").serialize() + "&quiz=" + quizNum + "&time=" + timePerQuiz + "&quizType=" + quizType;
            $.ajax({
                url:$("#myForm").attr("action"),
                type:'post',
                data: data,
                success:function(response){
                    quizNum ++;
                    $("input:radio").removeAttr("checked");
                    if(!setForm()){
                        $("#myForm").css("display","none");
                        $("#closingQuiz").css("display","inline");
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
