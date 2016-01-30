var greatNounList;
var tmpCache = [];
var localTextParsing = function(subtitle){
	var punctuationless = (subtitle.trim()).replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '');
	var cleanString = punctuationless.replace(/\s{2,}/g, " ");
	var words = cleanString.split(" ");
	var localJson = [];
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
		        localJson.push({ "word": tmp, "frequency": 1 });
		    }
		    else {
		        var isNewNoun = false;
		        for (var i = 0; i < greatNounList.length; i++) {
		            if (greatNounList[i].toUpperCase() == tmp.toUpperCase()) {
		                localJson.push({ "word": tmp, "frequency": 1 });
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
