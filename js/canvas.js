var width, height, force, node, nodes, link, links, label, drag, svg, tick, container, graph, zoom, overlappingLink, drag_line, div;
var selectedNode = null;
var selectedNodeObj = null;
var selectedLink = null;
var selectedLinkObj = null;
var dragNodeObj = null;
var mousedown_node = null;
var mouseup_node = null;
var radius = 30;   // base radius for circle
var canvasLeft = 0;
var canvasTop = 0;
var clickOntoLinks = false;
var translate = [0, 0];
var newAddedClickLink = false;
var scaleMin = 0.5;
var scaleMax = 2;
var scale = 1;
var doubleClickNode = false;
var doubleClickLink = false;
var editLinkName = false;

//The below parameters are for the pilot study purpose
var isLinkingable = true; //false: can not link two concepts
var addNewConcept = true; //false: can not add new empty concept by double-clicking
var isEditable = true; //false: can not edit concept/link name.

var log2 = function (val)
{
    if(val <= 4){
        return Math.log(val) / Math.log(2);
    }
    else{
        return 2 + Math.log(val) / Math.log(10);
    }
};

var updateSize = function (updatwWidth, updateheight) {
    width = updatwWidth;
    height = updateheight;

    svg.attr("width", width)
    .attr("height", height);

    force.size([width, height]);
    force.start();
}

var drawCanvas = function (canvasWidth,canvasHeight,canvasPositionX,canvasPositionY) {
    //initialize
    console.log("D3-Canvas");
    cleanCache();
    width = canvasWidth;
    height = canvasHeight;
    canvasLeft = canvasPositionX;
    canvasTop = canvasPositionY;
    nodes = [];
    links = [];

    force = d3.layout.force()
    .size([width, height])
    .nodes(nodes) 
    .links(links)
    .linkDistance(200)
    .charge(function (d) { return -600 * log2(d.frequency + 1); });
    //.charge(0)
    //.on("tick", tick);
    //drag = force.drag()
    drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragging)  
        .on("dragend", dragend);

    zoom = d3.behavior.zoom()
        .scaleExtent([scaleMin, scaleMax])
        .on("zoom", zoomed);

    // Define the div for the tooltip
    div = d3.select("body").append("div")   
        .attr("class", "tooltip")         
        .style("opacity", 0);

    svg = d3.select("#rightPanelDown").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("tabindex",0)
        .call(zoom)
        .on("dblclick.zoom", null)
        .on("click", clickSVG)
        .on("dblclick", dblclickSVG)
        .on('keydown',svgKeydown)
        .on('mousemove',mouseMove);
       
    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr("viewBox", "0 -5 10 10")
        .attr('refX', 6)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#000')
        .attr("stroke-width", "1px")
        .attr("fill-opacity",0.8);

    // line displayed when dragging new nodes
    drag_line = svg.append('svg:path')
      .attr('class', 'link dragline hidden')
      .attr('d', 'M0,0L0,0');

    //svg.append('svg:defs').append('svg:marker')
    //    .attr('id', 'start-arrow')
    //    .attr('viewBox', '0 -5 10 10')
    //    .attr('refX', 4)
    //    .attr('markerWidth', 6)
    //    .attr('markerHeight', 6)
    //    .attr('orient', 'auto')
    //        .append('svg:path')
    //        .attr('d', 'M10,-5L0,0L10,5')
    //        .attr('fill', '#000')
    //        .attr("stroke-width", "1px");

    container = svg.append("g");
    node = container.selectAll(".node");
    link = container.selectAll(".link");
    label = container.selectAll(".label");
    overlappingLink = container.selectAll(".overlappingLink");

    tick = function() {
        //link.attr("x1", function (d) { return d.source.x; })
        //    .attr("y1", function (d) { return d.source.y; })
        //    .attr("x2", function (d) { return d.target.x; })
        //    .attr("y2", function (d) { return d.target.y; });

        //link.attr("d", function (d) {
        //    return 'M' + d.source.x + ',' + d.source.y + ',' + 'L' + d.target.x + ',' + d.target.y;
        //});
        link.each(function () { this.parentNode.insertBefore(this, this); });

        link.attr('d', function (d) {
            var deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                normX = deltaX / dist,
                normY = deltaY / dist,
                sourcePadding = log2(d.source.frequency + 1) * radius,
                targetPadding = log2(d.target.frequency + 1) * radius + 5,
                sourceX = d.source.x + (sourcePadding * normX),
                sourceY = d.source.y + (sourcePadding * normY),
                targetX = d.target.x - (targetPadding * normX),
                targetY = d.target.y - (targetPadding * normY);

            if(d.linkType == "Curve")
                return 'M' + sourceX + ',' + sourceY + 'A' + dist + ',' + dist + ' 0 0,1 ' + targetX + ',' + targetY;
            else if (d.linkType == "Line")
                return 'M' + sourceX + ',' + sourceY + 'L' + targetX + "," + targetY;
            else { throw "No linkType Matched!";}
        });

        overlappingLink.each(function () { this.parentNode.insertBefore(this, this); });

        overlappingLink.attr('d', function (d) {
            var deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                normX = deltaX / dist,
                normY = deltaY / dist,
                sourcePadding = log2(d.source.frequency + 1) * radius,
                targetPadding = log2(d.target.frequency + 1) * radius + 5,
                sourceX = d.source.x + (sourcePadding * normX),
                sourceY = d.source.y + (sourcePadding * normY),
                targetX = d.target.x - (targetPadding * normX),
                targetY = d.target.y - (targetPadding * normY);

            if (d.linkType == "Curve")
                return 'M' + sourceX + ',' + sourceY + 'A' + dist + ',' + dist + ' 0 0,1 ' + targetX + ',' + targetY;
            else if (d.linkType == "Line")
                return 'M' + sourceX + ',' + sourceY + 'L' + targetX + "," + targetY;
            else { throw "No linkType Matched!"; }
        });

        node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

        //if without textPath, lable-X,Y should be updated in the tick
        //label.attr("x", function (d) { return (d.source.x + d.target.x) / 2; })
        //     .attr("y", function (d) { return (d.source.y + d.target.y) / 2; })

        if (selectedLinkObj && editLinkName)
        {
            $(".inputText").css({
                "left": canvasLeft + (selectedLinkObj.source.x + selectedLinkObj.target.x) / 2 * scale + translate[0], "top": canvasTop + (selectedLinkObj.source.y + selectedLinkObj.target.y) / 2 * scale + translate[1], "visibility": "visible"
            });
            $(".inputText").focus();
        }
    }

    force.on("tick", tick);
}
function zoomed() {
    if(mousedown_node) return; //when connect nodes; disable the zoom and pan feature
    if(nodes.length == 0) return; //when there are no nodes and links in the canvas, disable the zoom feature.
    div.style("opacity", 0); 
    $(".inputText").css({"visibility": "hidden" });
    translate = d3.event.translate;
    scale = d3.event.scale;
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    tick();
}

function pantoCentre(selection, d){
    console.log(translate);
    var centerPointX = width/2;
    var centerPointY = height/2;

    d3.transition().duration(1000).tween("zoom", function() {
        var ix = d3.interpolate(translate[0], centerPointX - scale * d.x);
        var iy = d3.interpolate(translate[1], centerPointY - scale * d.y);
        return function(t){
            zoom.translate([ix(t), iy(t)]).event(svg);
        }
    });
    // d3.event.translate[0] = centerPointX - d.x;
    // d3.event.translate[1] = centerPointY - d.y;
    // container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
//******************************************************************
//Drag and Click operations
function dragstart(d) {//Start dragging node
    //if (d3.event.defaultPrevented) return;
    //d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.stopPropagation(); // silence other listeners
    console.log("dragstart");
    clickOntoLinks = true;
    d3.select(this).classed("fixed", d.fixed = true);
    div.style("opacity", 0); 
}
function dragging(d)//drag node
{
    var oldPX = d.px,
        oldPY = d.py,
        oldX = d.x,
        oldY = d.y;
    //if we donot need nodes across
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    //d.px = d3.event.x;
    //d.py = d3.event.y;
    //d.x = d3.event.x;
    //d.y = d3.event.y

    nodes.forEach(function (nodeValue, nodeIndex) {
        if (nodeValue.fixed && nodeValue != d)
        {
            var deltaX = d.x - nodeValue.x;
            var deltaY = d.y - nodeValue.y;
            var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            var sumRadius = log2(d.frequency + 1) * radius + log2(nodeValue.frequency + 1) * radius;
            if (distance <= sumRadius)
            {
                console.log("Collision Detection");
                d.px = oldPX;
                d.py = oldPY;
                d.x = oldX;
                d.y = oldY;
            }
        }
    });

    div.style("opacity", 0); 
    //tick();
    //force.resume();
}
function dragend(d)//end dragging node
{
    console.log("dragend");
    div.style("opacity", 0); 
    tick();
    force.resume();
}
function dblclick(d) {//double click node
    if (d3.event.defaultPrevented) return;

    console.log("double click node-1");
    d3.select(this).classed("fixed", d.fixed = false);
    d3.select(this).classed("selected", d.selected = false);
    
    if (d == selectedNodeObj)
        clearTimeStamp();
    
    doubleClickNode = true;
}
function oneclick(d) {//one click node
    if (d3.event.defaultPrevented) return;
    pantoCentre(d3.select(this), d);
    console.log(d);
    if(!d3.event.ctrlKey && !d3.event.altKey){//click node without pressing ctrl key
        if(!d.selected){
            //This node is not selected.
            if(!selectedNode){
                //If no selected node, select this new node;
                selectedNode = d3.select(this);
                selectedNodeObj = d;
                d3.select(this).classed("selected", d.selected = true);
                hideEditedLink();
            }
            else{
                //If there is selected node, unselect it and select this new node.
                unselectNode();          
                selectedNode = d3.select(this);
                selectedNodeObj = d;
                selectedNode.classed("selected", d.selected = true);
            }
            console.log('select node x: ' + selectedNodeObj.x + "   y: " + selectedNodeObj.y);
            $("#subtitle").removeHighlight();
            if(selectedNodeObj.word && selectedNodeObj.video){//This is an empty node
                drawTimeline(selectedNodeObj.word, selectedNodeObj.video);
                $("#subtitle").highlight(d.word,"highlight");
            }

            unselectLink();
        }
        else{
            //This node has been selected.
            clearTimeStamp();
        }
    }
    else{//click node with pressing ctrl key to connect nodes

        if(!mousedown_node){
            mousedown_node = d;
            mousedown_node.cursorX = d3.mouse(d3.select('svg').node())[0];
            mousedown_node.cursorY = d3.mouse(d3.select('svg').node())[1];
            //position the drag_line
            drag_line
                .style('marker-end', 'url(#end-arrow)')
                .classed('hidden', false)
                .attr('d', 'M' + mousedown_node.cursorX + ',' + mousedown_node.cursorY + 'L' + mousedown_node.cursorX + ',' + mousedown_node.cursorY);
            
            tick();
        }
        else{
            drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            //check for drag-to-self
            mouseup_node = d;
            if(mousedown_node === mouseup_node) {
                resetMouseEvent();
                return;
            }
            // mousedown_node is the souce node and mouseup_node is the target node

            //check if the conect is depuliated
            var depulicatedConnect = false;
            links.forEach(function (linkValue, linkIndex) { // Depulicated connect is not allowed
                if (linkValue.source == mousedown_node && linkValue.target == mouseup_node)
                {
                    depulicatedConnect = true;
                    return; // it only exits the forEach function but not exits the parent function.
                }
            });
            if (depulicatedConnect) return;

            // add link to graph
            clickOntoLinks = true;
            var linkIndex = 0;
            if (links.length != 0)
                linkIndex = links[links.length - 1].linkIndex + 1;

            links.push({ "source": mousedown_node, "target": mouseup_node, "linkName": null, "linkType": "Line", "linkIndex":linkIndex});
            newAddedClickLink = true;
            updateLinkType(links[links.length - 1], true);

            restartLinks();
            restartLabels();

            selectedLinkObj = links[links.length - 1];
            drawLink(selectedLinkObj);

            unselectNode();
        }
    }
}
function clickLink(d) // one click link
{
    console.log("clickLink-1");
    clickOntoLinks = true;
    doubleClickLink = true;

    if(selectedLink){
        selectedLink.classed("selected", false);
    }

    if(!selectedLinkObj || selectedLinkObj.linkIndex != d.linkIndex){
        var linkIndex = "#linkIndex" + d.linkIndex;
        selectedLink = d3.select(linkIndex);
        selectedLink.classed("selected", true);
        selectedLinkObj = d;
        drawLink(d);

        unselectNode();
    }
    else{
        unselectLink();
    }
    restartLinks();
}

function drawLink(d){
    var videoS = d.source.video;
    var videoT = d.target.video;
    var showLink = false;
    videoS.forEach(function(videoSItem){
        videoT.forEach(function(videoTItem){
            if(videoSItem.startTime == videoTItem.startTime && videoSItem.endTime == videoTItem.endTime){
                showLink = true;
            }
        });
    });
    if(showLink){
        drawLinkToTimeline(d.source,d.target);
    }
    else{
        $("#clips").text("No such link in the video.");
        resetTimeline();
        setTimeout(function(){
            $("#clips").text("");
        }, 1500);
    }
}

function clickSVG(d)
{
    console.log('click the SVG');
    if (clickOntoLinks) {
        clickOntoLinks = false;
    }
    else {
        if($(".inputText").css("visibility")==='visible'){
            if(editLinkName){
                updateLinkLabelName($(".inputText").val().trim());
            }
            hideEditedLink();
        }
    }
}
function dblclickSVG(d) {
    console.log("dblclickSVG-2");
    if (doubleClickNode){
        doubleClickNode = false;
        return;
    }
    if (doubleClickLink) {
        doubleClickLink = false;
        return;
    }
    if(addNewConcept){
        var addNewNode = true;
        nodes.forEach(function (nodeValue, nodeIndex) {
            if (nodeValue.word == "")
                addNewNode = false;
        });
        if (addNewNode)
        {
            nodes.push({ "word": "", "frequency": 1, "video":[], "x": d3.event.x, "y": d3.event.y, "dx": d3.event.x, "dy": d3.event.y,});
            restartNodes();
        }
    }
}
//******************************************************************
//Update the concept Name, links and labels of links
var restartLabels = function () { //redrawing Labels
    label = label.data(links);

    console.log(JSON.stringify(links));

    //Data-join: Update
    label.select("textPath")
    .attr("xlink:href",null)
    .attr("xlink:href", function (d) { return "#linkIndex"+d.linkIndex; })
    .text(function (d) {return d.linkName })
    .style("font-size", function (d) { return 15 * log2((d.source.frequency + d.target.frequency)/2 + 1) + "px" });

    //Data-Join: Enter
    var enterLabel = label.enter().insert("text",".node")
    .attr("class", "label")
     //if without textPath, we need to set x y for path 
    //.attr("x", function (d) { return (d.source.x + d.target.x) / 2; })
    //.attr("y", function (d) { return (d.source.y + d.target.y) / 2; })
    .attr("text-anchor", "middle")
    .attr("dy", -5)
    .style("font-size", function (d) { return 15 * log2((d.source.frequency + d.target.frequency)/2 + 1) + "px" })
    .append("textPath")
    .attr("xlink:href", function (d) { return "#linkIndex"+d.linkIndex; })
    .attr("startOffset", "50%")
    .text(function (d) { return d.linkName });

    //Data-Join: Exit
    label.exit().remove();
}
var restartLinks = function() {//redrawing Links
    console.log("HomePage--linkNum:" + force.links().length);
    console.log("NodesNumafterlinking:" + force.nodes().length);

    link = link.data(links);
    overlappingLink = overlappingLink.data(links);
    //Data-join: Update
    //link.style('marker-end', 'url(#end-arrow)');
    link.attr("id", function (d) { return "linkIndex" + d.linkIndex; });

    //Data-Join: Enter
    var enterLink = link.enter().insert("path", ".node")
        .attr("class", "link")
        .attr("id", function (d) { return "linkIndex" + d.linkIndex; })
        .style('marker-end', 'url(#end-arrow)');
   
    var enterOverlappingLink = overlappingLink.enter().insert("path", ".node")
    .attr("class", "overlappingLink")
    .on("click", clickLink);

    if (newAddedClickLink) {
        if(selectedLink){
            selectedLink.classed("selected", false);
        }

        editLinkName = true;
        selectedLink = enterLink;
        enterLink.attr("class", "link selected");
        newAddedClickLink = false;
    }
        
    //Data-Join: Exit
    link.exit().remove();
    overlappingLink.exit().remove();

    force.start();
}

var removeHiddenNodes = function (){
    d3.selectAll('.node').filter(function(d){
        return (!d.highlighted);
    }).attr("opacity", 0);
    d3.selectAll('.node').filter(function(d){
        return (d.highlighted);
    }).attr("opacity", 1);
}

var restartNodes = function () {//redrawing Nodes
    //Printf for debugging
    console.log("NodeNum:" + force.nodes().length);
    //console.log(JSON.stringify(nodes));
    node = node.data(force.nodes(), function (d) { return d.word; });

    //Data-Join : Update
    // node.attr("class", function (d) {
    //     if (d.fixed && d.selected){
    //         return "node fixed selected";
    //     }
    //     else if (d.fixed) {
    //         return "node fixed";
    //     }
    //     else if (d.selected) {
    //         return "node selected";
    //     }
    //     else {
    //         return "node";
    //     }
    // });

    //Update existing nodes
    node.select("circle")
        .transition().duration(200)
        .attr("r", function (d) { return radius * log2(d.frequency + 1); });

    node.select("text")
        .attr("dy", ".35em")
        .transition().duration(200)
        .style("font-size", function (d) {return Math.min(2 * radius * log2(d.frequency + 1), (2 * radius * log2(d.frequency + 1) - 8) / d.textlength * 24) + "px"; });
        
    //Data-Join: Enter
    var nodeEnter = node.enter().append("g")
         .attr("class", function (d) {
            if (d.fixed && d.selected){
                return "node fixed selected";
            }
            else if (d.fixed) {
                return "node fixed";
            }
            else if (d.selected) {
                return "node selected";
            }
            else {
                return "node";
            }
         })
        //.attr("id", function (d) { return d.id; })
        .on("dblclick", dblclick)
        .on("click", oneclick)
        .on('mouseover',nodeMouseover)
        .on('mouseout', nodeMouseout)
        .call(drag);

    nodeEnter.append("circle")
        .attr("class", "circle")
        .attr("r", 0)
        .transition().duration(500)
        .attr("r", function (d) { return radius * log2(d.frequency + 1); });

    nodeEnter.append("text")
        .text(function (d) { return d.word; })
        .style("font-size", function (d) { d.textlength = this.getComputedTextLength(); return "0px"; })
        .transition().duration(500)
        .style("font-size", function (d) { return Math.min(2 * radius * log2(d.frequency + 1), (2 * radius * log2(d.frequency + 1) - 8) / d.textlength * 24) + "px"; })
        .attr("dy", ".35em");

    //Data-Join: Exit
    node.exit().select("circle")
        .transition().duration(500)
        .attr("r", 0);

    node.exit().select("text")
        .transition().duration(500)
        .style("font-size", "0px");

    node.exit().transition().duration(500).remove();

    force.start();
}
//****************************************************************************
//modify the node and link
var AddConcept = function(jsonData) { //Analyse the textarea/jsonData and update Nodes 
    var graph = {};
    graph.nodes = JSON.parse(jsonData);
    console.log("graph:" + jsonData);
    //Add new nodes and update the frequency
    graph.nodes.forEach(function (graphValue, graphIndex) {
        var tmpVideo = graphValue.video;//Check if there is exising video time stamp. The lenght of it should be 0 or 1.
        var isExist = false;//If the word exists in the graph
        var isVideoExist = false; //If the video in the new node exists in the auto searched results or existing video array
        nodes.forEach(function (nodesValue, nodesIndex) {
            if(nodesValue.word.toLowerCase() == graphValue.word.toLowerCase())
            {//The word is existing in the graph
                nodesValue.frequency ++;
                if(tmpVideo.length > 0){
                    nodesValue.video.forEach(function(videoItem){
                        if(tmpVideo[0].startTime == videoItem.startTime && tmpVideo[0].endTime == videoItem.endTime){
                            isVideoExist = true;
                            return;
                        }
                    });
                    if(!isVideoExist){
                        nodesValue.video.push({"startTime": tmpVideo[0].startTime,"endTime":tmpVideo[0].endTime});
                    }
                }
                isExist = true;
                return;
            }
        });
        if (!isExist) // The word is not existing in the graph
        {
            var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
            var myCues = myTrack.cues;   // get list of cues 
            var videoTime = []; //Auto searched results on the "graphValue.word"
            for(var i = 0; i < myCues.length; i++){
                if(myCues[i].getCueAsHTML().textContent.search(new RegExp(graphValue.word, "i")) != -1){
                    videoTime.push({"startTime": myCues[i].startTime,"endTime":myCues[i].endTime});
                }
            }
            //Check if the tmpVideo exists in the videoTime
            if(tmpVideo.length > 0){
                videoTime.forEach(function(videoItem){
                    if(tmpVideo[0].startTime == videoItem.startTime && tmpVideo[0].endTime == videoItem.endTime){
                        isVideoExist = true;
                        return;
                    }
                });

                if(!isVideoExist){
                    videoTime.push({"startTime": tmpVideo[0].startTime,"endTime":tmpVideo[0].endTime});
                }
            }

            graphValue.video = videoTime;
            graphValue.frequency = videoTime.length;
            nodes.push(graphValue);
        }
    });
    restartNodes();
}

var updateConceptName = function (inputText, manualVideoTime)//Update Node word for Nodes
{
    var selectedNodeIndex = nodes.indexOf(selectedNodeObj);
    nodes.splice(selectedNodeIndex, 1);
    var newAddNode = null;
    nodes.forEach(function (nodeValue, nodeIndex) {
        if (nodeValue.word.toLowerCase() == inputText.toLowerCase()) {
            newAddNode = nodeValue;
        }
    });
    if (!newAddNode) {
        newAddNode = JSON.parse(JSON.stringify(selectedNodeObj));
        newAddNode.word = inputText;
        newAddNode.description = selectedNodeObj.description;

        var myTrack = document.getElementsByTagName("track")[0].track; // get text track from track element
        var myCues = myTrack.cues;   // get list of cues 
        var autoVideoTime = [];
        for(var i = 0; i < myCues.length; i++){
            if(myCues[i].getCueAsHTML().textContent.search(new RegExp(inputText, "i")) != -1){
                autoVideoTime.push({"startTime": myCues[i].startTime,"endTime":myCues[i].endTime});
            }
        }
        if(autoVideoTime.length != 0){
            newAddNode.video = autoVideoTime;
            newAddNode.frequency = autoVideoTime.length;
            newAddNode.isSubtitle = true;
        }
        else if(manualVideoTime.length != 0){
            newAddNode.video = manualVideoTime;
            newAddNode.frequency = manualVideoTime.length;
            newAddNode.isSubtitle = false;
        }
        else{
            newAddNode.video = [];
            newAddNode.isSubtitle = false;
            //To do: need to change the code below. It depends on how we want to make use fo the frequency attribute.
            newAddNode.frequency = 1;
        }
        nodes.push(newAddNode);
    }
    else {
        //need to delete the corresponding self - links
        if(newAddNode.description)
            newAddNode.description += selectedNodeObj.description;
        else
            newAddNode.description = selectedNodeObj.description;

        if(manualVideoTime.length != 0){//Add the manul video time to the existing node
            newAddNode.video.push({"startTime": manualVideoTime[0].startTime,"endTime":manualVideoTime[0].endTime});
            newAddNode.frequency ++;
        }
        //frequency stands for the length of video stamps stored in the node
        
        for (var i = 0; i < links.length; i++)
        {
            if (links[i].source == selectedNodeObj && links[i].target == newAddNode)
                links.splice(i--, 1);
            else if(links[i].source == newAddNode && links[i].target == selectedNodeObj)
                links.splice(i--, 1);
            else{}
        }
    }

    links.forEach(function (linkValue, linkIndex) {
        if (linkValue.source == selectedNodeObj)
            linkValue.source = newAddNode;
        else if (linkValue.target == selectedNodeObj)
            linkValue.target = newAddNode;
        else { }
    });

    newAddNode.selected = false;

    clearTimeStamp();

    restartNodes();
    restartLinks();
    restartLabels();
}

var unselectNode = function(){
    if(selectedNode){
        selectedNode.classed("selected", selectedNodeObj.selected = false);
        selectedNode = null;
        selectedNodeObj = null;
    }
    document.getElementById('draggable').style.visibility = 'hidden';
    $("#subtitle").removeHighlight();
}

var unselectLink = function(){
    if(selectedLink){
        selectedLink.classed("selected", false);
        selectedLink = null;
        selectedLinkObj = null;
    }
}

var updateLinkLabelName = function(inputText) //update label name for link
{
    selectedLinkObj.linkName = inputText;
    hideEditedLink();
    restartLabels();
    tick();
    //restartLinks();
    //console.log(inputText);
};

var delLinkandLabel = function ()//delete selected link and its label
{
    hideEditedLink();
    links.forEach(function (linkvalue, linkIndex) {
        if (linkvalue == selectedLinkObj) {
            links.splice(linkIndex, 1);
            return;
        }
    });
    updateLinkType(selectedLinkObj,false);
    selectedLink.classed("selected", false);
    selectedLinkObj = null;
    selectedLink = null;

    restartLinks();
    restartLabels();
}

var delNodeWithLink = function ()//delete seleced node and its associated links
{
    hideEditedLink();
    nodes.forEach(function (nodeValue, nodeIndex) {
        if (nodeValue == selectedNodeObj)
        {
            nodes.splice(nodeIndex, 1);
            return;
        }
    });

    for (var i = 0; i < links.length; i++)
    {
        if (links[i].source == selectedNodeObj || links[i].target == selectedNodeObj)
        {
            if(links[i] == selectedLinkObj){
                selectedLink.classed("selected", false);
                selectedLinkObj = null;
                selectedLink = null;
            }
            links.splice(i--, 1);
        }
    }

    selectedNode = null;
    selecedNodeObj = null;

    restartNodes();
    restartLinks();
    restartLabels();
}

var updateLinkType = function (targetedLink, isLinkAdded)
{
    links.forEach(function (linkValue, linkIndex) {
        if (linkValue.source == targetedLink.target && linkValue.target == targetedLink.source)
        {
            if (isLinkAdded) {
                linkValue.linkType = "Curve";
                targetedLink.linkType = "Curve";
            }
            else
                linkValue.linkType = "Line";

            return;
        }
    });
}

var linkstoNodes = function () {
    links.forEach(function (linkValue, linkIndex) {
        nodes.forEach(function (nodeValue, nodeIndex) {
            if (nodeValue.word == linkValue.source.word)
            {
                linkValue.source = nodeValue;
            }
            else if (nodeValue.word == linkValue.target.word) {
                linkValue.target = nodeValue;
            }
            else { }
        });
    });
};

var hideEditedLink = function () {
    $(".inputText").css({ "visibility": "hidden" });
    $(".inputText").val("");
    editLinkName = false;
};
//**************************************************************************
//Keyboard event
var svgKeydown = function (){
    if(d3.event.ctrlKey || d3.event.altKey) return;
    if(!isEditable) return; // if the concept-map is not editable
    if (!selectedLinkObj && !selectedNodeObj) return;
    //if ($(".inputText").css("visibility") === 'visible') return;
    console.log(d3.event.keyCode);

    switch (d3.event.keyCode) {
        case 187: //+ to increase the frequency of the node
            if(selectedNodeObj){
                selectedNodeObj.frequency ++;
                restartNodes();
                restartLinks();
                restartLabels();
            }
            break;
        case 189: //- to decrease the frequency of the node
            if(selectedNodeObj){
                if(selectedNodeObj.frequency > 1){
                    selectedNodeObj.frequency --;
                    restartNodes();
                    restartLinks();
                    restartLabels();
                }
                
                restartNodes();
                restartLinks();
                restartLabels();
            }
            break;
        case 69: //Edit
            if (selectedNodeObj) 
            {
                console.log('edit the node');
                document.getElementById('draggable').style.visibility = 'visible';
                $("#draggable").find("input").val(selectedNodeObj.word);
                $("#draggable").find("textarea").val('');
                $("#draggable").find("#startTime").empty();
                $("#draggable").find("#startTime").removeAttr('time');
                $("#draggable").find("#endTime").empty();
                $("#draggable").find("#endTime").removeAttr('time');
                if(selectedNodeObj.description){
                    $("#draggable").find("textarea").val(selectedNodeObj.description);
                }
                if(selectedNodeObj.video && selectedNodeObj.video.length == 1){
                    var startTime = selectedNodeObj.video[0].startTime;
                    $("#draggable").find("#startTime").attr('time',startTime);
                    $("#draggable").find("#startTime").text(Math.floor(startTime/60) + " min: "+ Math.floor((startTime - Math.floor(startTime/60) * 60)) + " sec");
                    var endTime = selectedNodeObj.video[0].endTime;
                    $("#draggable").find("#endTime").attr('time',endTime);
                    $("#draggable").find("#endTime").text(Math.floor(endTime/60) + " min: "+ Math.floor((endTime - Math.floor(endTime/60) * 60)) + " sec");
                }
                // if(selectedNodeObj.endTime){
                //     $("#draggable").find("#endTime").val(selectedNodeObj.description);
                // }
                
                d3.event.preventDefault();
            
                // console.log('edit the node label');
                // $(".inputText").val(selectedNodeObj.word);
                // $(".inputText").css({
                //     "left": canvasLeft + selectedNodeObj.x * scale + translate[0], "top": canvasTop + selectedNodeObj.y * scale + translate[1], "visibility": "visible"
                // });
                // $(".inputText").focus();
                // d3.event.preventDefault();
            }
            else if(selectedLinkObj){
                editLinkName = true;
                console.log('edit the link label');
                if (selectedLinkObj.linkName && selectedLinkObj.linkName != "")
                {
                    $(".inputText").val(selectedLinkObj.linkName);
                    selectedLinkObj.linkName = "";
                    restartLabels();
                }
                $(".inputText").css({
                    "left": canvasLeft + (selectedLinkObj.source.x + selectedLinkObj.target.x) / 2 * scale + translate[0], "top": canvasTop + (selectedLinkObj.source.y + selectedLinkObj.target.y) / 2 * scale + translate[1], "visibility": "visible"
                });
                //$(".inputText").css({ "left": d3.event.x, "top": d3.event.y, "visibility": "visible" });
                $(".inputText").focus();
                d3.event.preventDefault();
            }
            else{}
            break;
        case 46: //delete
            if (selectedNodeObj)
            {
                delNodeWithLink();
                resetTimeline();
            }
            else if (selectedLinkObj)
            {
                delLinkandLabel();
                resetTimeline();
            }
            else{}
            break;
    }

}
//************************************************************************
//Mouse event on nodes
var resetMouseEvent = function(){
    mousedown_node.cursorX = null;
    mousedown_node.cursorY = null;
    mousedown_node = null;
    mouseup_node = null;
}

var nodeMouseover = function(d){
    //console.log('mouse over a node');
    if(d.description && d.description != ''){
        div.transition()       
            .duration(200)      
            .style("opacity", .9);      
        div .html(d.description + "<br/>")
            .style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY) + "px"); 
    }
}

var nodeMouseout = function(d){
    div.transition()        
        .duration(200)      
        .style("opacity", 0);   
}

var mouseMove = function(){
    if(mousedown_node) {
        if(d3.event.ctrlKey || d3.event.altKey){
            //update drag line
            drag_line.attr('d', 'M' + mousedown_node.cursorX + ',' + mousedown_node.cursorY + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
        }
        else{
            drag_line
                .classed('hidden',true)
                .style('marker-end', '');

            resetMouseEvent();
        }
    }
}
//************************************************************************
// var saveNoteToFile = function (textContent)
// {
//     var savedString = {};
//     savedString.text = textContent;
//     savedString.node = nodes;
//     savedString.link = links;
//     return JSON.stringify(savedString);
// }
var cleanCache = function () {
    svg = null;
    container = null;
    selectedNode = null;
    selectedNodeObj = null;
    selectedLink = null;
    selectedLinkObj = null;
    mousedown_node = null,
    mouseup_node = null;
    dragNodeObj = null;
    radius = 30;   // base radius for circle
    clickOntoLinks = false;
    translate = [0, 0];
    scale = 1;
}

//************************************************************************
var saveNote = function () {
    var savedString = {};
    savedString.node = nodes;
    savedString.link = links;
    return JSON.stringify(savedString);
}

var setNote = function(result){
    //Each time when you read a new *.json to the system; the existing concept map will be removed and load the new one.
    selectedNode = null;
    selectedNodeObj = null;
    selectedLink = null;
    selectedLinkObj = null;
    dragNodeObj = null;
    clickOntoLinks = false;
    translate = [0, 0];
    scale = 1;

    nodes.splice(0, nodes.length);
    links.splice(0, links.length);

    if(result.node){
        result.node.forEach(function(nodeItem){
            nodes.push(nodeItem);
        });
    }

    if(result.link){
        result.link.forEach(function(linkItem){
            links.push(linkItem);
        });      
    }

    linkstoNodes();
    restartNodes();
    restartLinks();
    restartLabels();
}

var printAllConceptNames = function (){
    console.log('-----------Print All Concept Names-------');
    nodes.forEach(function(nodeItem){
        console.log(nodeItem.word);
    });   
    console.log('-----------------------------------------'); 
}