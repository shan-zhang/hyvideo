var width, height, force, node, nodes, link, links, label, drag, svg, tick, container, graph, zoom, overlappingLink;
var selectedNode = null;
var selectedNodeObj = null;
var selectedLink = null;
var selectedLinkObj = null;
var dragNodeObj = null;
var radius = 30;   // base radius for circle
var canvasLeft = 0;
var canvasTop = 0;
var clickOntoLinks = false;
var translate = [0, 0];
var newAddedClickLink = false;
var scaleMin = 0.3;
var scaleMax = 1.5;
var scale = 1;
var doubleClickNode = false;
var doubleClickLink = false;
var editLinkName = false;

//The below parameters are for the pilot study purpose
var isLinkingable = false; //false: can not link two concepts
var addNewConcept = false; //false: can not add new empty concept by double-clicking
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
    .nodes(nodes) // initialize with a single node
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

    svg = d3.select("#rightPanel").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom)
        .on("dblclick.zoom", null)
        .on("click", clickSVG)
        .on("dblclick", dblclickSVG);
       
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

    //d3.select("#rightPanel").append("input")
    //.attr("class", "inputText")
    //.attr("type", "text");

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

    d3.select("#rightPanel")
    .on('keydown', keydown)
    .on('keyup', keyup);
}
function zoomed() {
    $(".inputText").css({"visibility": "hidden" });
    translate = d3.event.translate;
    scale = d3.event.scale;
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    tick();
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
    
    if(d.word && d.video){//This is an empty node
        drawTimeline(d.word, d.video);
        //$("#clips").text("Video clips timestamp:" + JSON.stringify(d.video));
        //console.log("Video clips timestamp:" + JSON.stringify(d.video));

        if(dragNodeObj && dragNodeObj.data()[0].word != d3.select(this).data()[0].word){
            dragNodeObj.classed("dragged", dragNodeObj.data()[0].dragged = false);
        }
        d3.select(this).classed("dragged", d.dragged = true);
        dragNodeObj = d3.select(this);

    }
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
    //tick();
    //force.resume();
}
function dragend(d)//end dragging node
{
    console.log("dragend");
    tick();
    force.resume();
}
function dblclick(d) {//double click node
    if (d3.event.defaultPrevented) return;

    console.log("double click node-1");
    d3.select(this).classed("fixed", d.fixed = false);
    d3.select(this).classed("connecting", d.connecting = false);
    
    if (d == selectedNodeObj) {
        selectedNodeObj = null;
        selectedNode = null;
    }
    doubleClickNode = true;
}
function oneclick(d) {//one click node
    if (d3.event.defaultPrevented) return;
    console.log("click node-1");
    if (d.fixed && !d.connecting) {
        if (!selectedNode) {
            selectedNode = d3.select(this);
            selectedNodeObj = d;
            d3.select(this).classed("connecting", d.connecting = true);
            hideEditedLink();
            //startClips();
        }
        else {
            if (selectedNodeObj == d) return; //Self-connected is not allowed

            if(!isLinkingable) {
                //For the pilot study, adding link is not allowed.
                selectedNode.classed("connecting", selectedNodeObj.connecting = false);
                //selectedNode.classed("fixed", selectedNodeObj.fixed = false);
                
                selectedNode = d3.select(this);
                selectedNodeObj = d;
                selectedNode.classed("connecting", d.connecting = true);
                return;
            }
            var depulicatedConnect = false;
            links.forEach(function (linkValue, linkIndex) { // Depulicated connect is not allowed
                if (linkValue.source == selectedNodeObj && linkValue.target == d)
                {
                    depulicatedConnect = true;
                    return; // it only exits the forEach function but not exits the parent function.
                }
            });
            if (depulicatedConnect) return;

            selectedNode.classed("connecting", selectedNodeObj.connecting = false);
            //saveCurrentState();
            clickOntoLinks = true;
            selectedNode.classed("fixed", selectedNodeObj.fixed = false);
            
            selectedNode.classed("connected", selectedNodeObj.connected = true);

            var linkIndex = 0;
            if (links.length != 0)
                linkIndex = links[links.length - 1].linkIndex + 1;

            links.push({ "source": selectedNodeObj, "target": d, "linkName": null, "linkType": "Line", "linkIndex":linkIndex});
            newAddedClickLink = true;
            updateLinkType(links[links.length - 1], true);
            selectedNode = null;
            selectedNodeObj = null;
            d3.select(this).classed("fixed", d.fixed = false);
            d3.select(this).classed("connecting", d.connecting = false);
            d3.select(this).classed("connected", d.connected = true);

            restartLinks();
            restartLabels();

            selectedLinkObj = links[links.length - 1];
            drawLink(selectedLinkObj);
            // var undoButton = document.getElementById("undoNote");
            // undoButton.style.visibility = "visible";
        }
    }
    else if (d.fixed && d.connecting) {
        d3.select(this).classed("connecting", d.connecting = false);
        selectedNode = null;
        selectedNodeObj = null;
    }
    else{

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
    console.log(selectedLinkObj);
    console.log(d);
    if(!selectedLinkObj || selectedLinkObj.linkIndex != d.linkIndex){
        var linkIndex = "#linkIndex" + d.linkIndex;
        selectedLink = d3.select(linkIndex);
        selectedLink.classed("selected", true);
        selectedLinkObj = d;
        drawLink(d);
    }
    else{
        selectedLink = null;
        selectedLinkObj = null;
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
        if(paper.project.layers.length != 1){
                paper.project.activeLayer.removeChildren();
                paper.project.view.update();
        }

        if(dragNodeObj){
            dragNodeObj.classed("dragged", dragNodeObj.data()[0].dragged = false);
        }

        setTimeout(function(){
            $("#clips").text("");
        }, 1500);
    }
}

function clickSVG(d)
{
    console.log("clickSVG-1");
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
            nodes.push({ "word": "", "frequency": 1, "x": d3.event.x, "y": d3.event.y, "dx": d3.event.x, "dy": d3.event.y });
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
    .style("font-size", function (d) { return 10 * log2((d.source.frequency + d.target.frequency)/2 + 1) + "px" });

    //Data-Join: Enter
    var enterLabel = label.enter().insert("text",".node")
    .attr("class", "label")
     //if without textPath, we need to set x y for path 
    //.attr("x", function (d) { return (d.source.x + d.target.x) / 2; })
    //.attr("y", function (d) { return (d.source.y + d.target.y) / 2; })
    .attr("text-anchor", "middle")
    .attr("dy", -5)
    .style("font-size", function (d) { return 10 * log2((d.source.frequency + d.target.frequency)/2 + 1) + "px" })
    .append("textPath")
    .attr("xlink:href", function (d) { return "#linkIndex"+d.linkIndex; })
    .attr("startOffset", "50%")
    .text(function (d) { return d.linkName });

    //Data-Join: Exit
    label.exit().remove();

    //force.start();
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
        //.on("click", clickLink);
   
    var enterOverlappingLink = overlappingLink.enter().insert("path", ".node")
    .attr("class", "overlappingLink")
    //.attr("id", function (d) { return "linkIndex" + d.linkIndex; })
    //.style('marker-end', 'url(#end-arrow)')
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

var restartNodes = function () {//redrawing Nodes
    //Printf for debugging
    console.log("NodeNum:" + force.nodes().length);
    //console.log(JSON.stringify(nodes));
    node = node.data(force.nodes(), function (d) { return d.word; });

    //Data-Join : Update
    // node.attr("class", function (d) {
    //     if (d.fixed) {
    //         // if (d.connecting) return "node fixed connecting";
    //         //     else return "node fixed";

    //         return "node fixed";
    //     }
    //     else if (d.connected) {
    //         return "node connected";
    //     }
    //     else if(d.dragged){
    //         return "node dragged";
    //     }
    //     else {
    //         return "node";
    //     }
    // });

    node.select("circle")
        .transition().duration(500)
        .attr("r", function (d) { return radius * log2(d.frequency + 1); });

    node.select("text")
        .transition().duration(500)
        .style("font-size", function (d) { return Math.min(2 * radius * log2(d.frequency + 1), (2 * radius * log2(d.frequency + 1) - 8) / d.textlength * 24) + "px"; })
        .attr("dy", ".35em");
    //Data-Join: Enter
    var nodeEnter = node.enter().append("g")
        //.attr("class", "node")
         // .attr("class", function (d) {
         //     if (d.fixed) {
         //         return "node fixed";
         //     }
         //     else if (d.connected) {
         //         return "node connected";
         //     }
         //     else if(d.dragged){
         //         return "node dragged";
         //     }
         //     else {
         //         return "node";
         //     }
         // })
        //.attr("id", function (d) { return d.id; })
        .on("dblclick", dblclick)
        .on("click", oneclick)
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

var analyseNodes = function(jsonData) { //Analyse the textarea/jsonData and update Nodes 
    var graph = {};
    graph.nodes = JSON.parse(jsonData);
    console.log("graph:" + jsonData);
    //Add new nodes and update the frequency of words
    graph.nodes.forEach(function (graphValue, graphIndex) {
        var isExist = false;
        nodes.forEach(function (nodesValue, nodesIndex) {
            if(nodesValue.word.toLowerCase() == graphValue.word.toLowerCase())
            {
                nodesValue.frequency += graphValue.frequency;
                nodesValue.video.push({"startTime": graphValue.video[0].startTime,"endTime":graphValue.video[0].endTime});
                isExist = true;
            }
        });
        if (!isExist)
        {
            nodes.push(graphValue);
        }
    });
    restartNodes();
}

//****************************************************************************
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
    selectedLinkObj = null;
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
            links.splice(i--, 1);
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
function keyup() {
    console.log(selectedLinkObj);
    if(!isEditable) return; // if the concept-map is not editable
    if ($(".inputText").css("visibility")==='visible') return;
    switch (d3.event.keyCode) {
        case 69: //Edit
            if (selectedNodeObj) {
                console.log('edit the node name');
                $(".inputText").css({
                    "left": canvasLeft + selectedNodeObj.x * scale + translate[0], "top": canvasTop + selectedNodeObj.y * scale + translate[1], "visibility": "visible"
                });
                $(".inputText").focus();
            }
            else if(selectedLinkObj){
                editLinkName = true;
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
            }
            else{

            }
            break;
    }
}

function keydown() {
    //d3.event.preventDefault(); //to stop the default keyboard event
    if(!isEditable) return; // if the concept-map is not editable
    if (!selectedLinkObj && !selectedNodeObj) return;
    switch (d3.event.keyCode) {
        case 46: //delete
            if (selectedLinkObj)
            {
                delLinkandLabel();
            }
            if (selectedNodeObj)
            {
                delNodeWithLink();
            }
            break;
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
    dragNodeObj = null;
    radius = 30;   // base radius for circle
    clickOntoLinks = false;
    translate = [0, 0];
    scale = 1;
}
// var saveCurrentState = function () {
//     var textShow = document.getElementById("textShow");
//     var savedString = saveNoteToFile(textShow.innerText.trim());
//     var titleName = document.getElementById("title");
//     DataExample.currentNoteState.Title = titleName.innerText.trim();
//     DataExample.currentNoteState.Data = savedString;
// }
var updateNoteNodeWord = function (inputText)//Update Node word for Nodes
{
    $(".inputText").css({ "visibility": "hidden" });
    $(".inputText").val("");
    if(inputText == '') {
        selectedNodeObj = null;
        selectedNode = null;
        restartNodes();
        return;
    };
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
        nodes.push(newAddNode);
    }
    else {
        //need to delete the corresponding self - links
        newAddNode.frequency += selectedNodeObj.frequency;
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

    newAddNode.fixed = false;
    newAddNode.connecting = false;
    newAddNode.connected = false;
    /*
    This part needs update if we set state/style for connected node.
    */
    //selectedNode.classed("connecting", selectedNodeObj.connecting = false);
    //selectedNode.classed("fixed", selectedNodeObj.fixed = false);
    //changeItemViewColor(selectedNodeObj, false);
    selectedNodeObj = null;
    selectedNode = null;
    restartNodes();
    restartLinks();
    restartLabels();
}
//************************************************************************
var saveNote = function () {
    var savedString = {};
    savedString.node = nodes;
    savedString.link = links;
    return JSON.stringify(savedString);
}

var setNote = function(result){
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