var greatNounList;
var conceptList;
var tmpCache = [];
var sendCuestoConceptTagging = function(text){
	//console.log(text);
	$.ajax({
		type: 'post',
		url: 'php/parser.php',
		// The first parser's name: AYLIEN
		//The second parser's name: AlchemyApi
		data: {'name':'Concepts','text':text, 'API':'AlchemyApi'},
		dataType: 'json',
		success: function(response) {
			conceptList = response.concepts;
			//Below is for AYLIEN
			// for(var i = 0; i < conceptList.length; i++){
			// 	document.getElementById("keyconcepts").innerHTML += ('<a target=\"_blank\" href=' + conceptList[i].url +'>'+ conceptList[i].concept.string +'</a>');
			// }
			//----------------------------------------------------------------------
			//Below is for AlchemyApi
			for(var i = 0; i < conceptList.length; i++){
				document.getElementById("keyconcepts").innerHTML += ('<a target=\"_blank\" href=' + conceptList[i].dbpedia +'>'+ conceptList[i].text +'</a>');
			}
			console.log(response);
		},
		error:function(error){
			console.log(error);
		}
	});
};
var localTextParsing = function(subtitle, startTime, endTime){
	var punctuationless = (subtitle.trim()).replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '');
	var cleanString = punctuationless.replace(/\s{2,}/g, " ");
	var words = cleanString.split(" ");
	var localJson = [];
	console.log("starttime:" + startTime + "	endTime:"+endTime);
	words.forEach(function (wordValue, wordIndex) {
		var isExisted = false;
		var tmp = wordValue.trim();
		localJson.forEach(function (JsonValue, JsonIndex) {
			//Check this word has already been stored into localJson
		    if (JsonValue.word.toUpperCase() == tmp.toUpperCase()) {
		        isExisted = true;
		        JsonValue.frequency++;
		    }
		});

		if (!isExisted) {
		    var isNoun = false;//Check if this word has appeared in the tmp Cache: either is noun or not.
		    for (var i = 0; i < tmpCache.length; i++) {
		        if (tmp.toUpperCase() == tmpCache[i].word.toUpperCase()) {
		            isNoun = tmpCache[i].isNoun;
		            break;
		        }
		    }
		    if (isNoun) {
		        localJson.push({ "word": tmp, "frequency": 1, "video": [{"startTime": startTime,"endTime":endTime}]});
		    }
		    else {
		        var isNewNoun = false;
		        for (var i = 0; i < greatNounList.length; i++) {
		            if (greatNounList[i].toUpperCase() == tmp.toUpperCase()) {
		                localJson.push({ "word": tmp, "frequency": 1, "video": [{"startTime": startTime,"endTime":endTime}]});
		                tmpCache.push({ "word": tmp, "isNoun": true });
		                isNewNoun = true;
		                break;
		            }
		        }
		        if (!isNewNoun) {
		            tmpCache.push({ "word": tmp, "isNoun": false });
		        }
		    }
		}
	});
    analyseNodes(JSON.stringify(localJson));
};
