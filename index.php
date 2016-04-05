<?php
    $file = file('data/Nouns.txt',FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
          <track src="video/example1.vtt" label="English subtitles" kind="subtitles" type="text/vtt" srclang='en' default></track>
        Your browser does not support the video tag.
        </video>
        <label>2-D Timeline</label>
        <canvas id='leftSub'>
        </canvas>
        <h3 id="clips"></h3>
        <button onclick="buttonClick()">test</button>
        <button onclick="buttonClick1()">test1</button>
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
        paper.install(window);
        paper.setup('leftSub');
        window.addEventListener("load",function() {
            var canvasWidth = document.getElementById('rightPanel').offsetWidth;
            var canvasHeight = document.getElementById('rightPanel').offsetHeight;
            var canvasPositionX = $('#rightPanel').offset().left;
            var canvasPositionY = $('#rightPanel').offset().top;
            drawCanvas(canvasWidth,canvasHeight,canvasPositionX,canvasPositionY);//Draw the D3 layout to the page
            greatNounList = <?php echo json_encode($file); ?>;
            //console.log(greatNounList);
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
        function buttonClick(){
            console.log("call drawTimeline");
            drawTimeline();
        }
        function buttonClick1(){
            if(paper.project.layers.length != 1){
                paper.project.activeLayer.removeChildren();
                paper.project.view.update();
            }
        }
        function drawTimeline(timeline){
            //console.log(paper.project);
            console.log("draw on the Timeline");
            console.log(timeline);
            if(paper.project.layers.length != 1){
                paper.project.activeLayer.removeChildren();
            }
            new paper.Layer();
            var duration = document.getElementById("video").duration;
            var viewSize = paper.view.viewSize.width;
            console.log(duration);
            timeline.forEach(function(timeStamp){
                console.log(viewSize*timeStamp.startTime/duration);
                var rect = new paper.Path.Rectangle(viewSize*timeStamp.startTime/duration,0,viewSize*(timeStamp.endTime - timeStamp.startTime)/duration,200);
                rect.style = {
                    fillColor: 'red'
                };
                rect.onClick = function(event){
                    this.fillColor = 'green';
                };
            });
            paper.project.view.update();
            console.log("Drawing is over");
        }
    </script>
</body>
</html>
