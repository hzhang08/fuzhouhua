var globalIndex = 0;
var fuzhou1Json = null;

var player = null;
var videoIdExternal = null;
var globalStartSeconds = -1; //since at one time, one page can only have one start time, so it is a global state

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: videoIdExternal,
        playerVars: {
        'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {

    player.loadVideoById("zZWsAze9iVI", globalStartSeconds);
    player.playVideo();
}

function search() {

    init();
    

    // alert("index is " + searchterm + index);
    // index += 1;
}

function init() {
    // const fs = require('fs');

    // fs.readFile('fuzhou1.json', (err, data) => {
    //     if (err) throw err;
    //     fuzhou1Json = JSON.parse(data);
    //     // console.log(myData.fieldName);
    // });

    fetch('./fuzhou1.json')
    .then((response) => response.json())
    .then((json) => {
        fuzhou1Json = json;
        let searchterm = document.getElementById("searchbox").value;

        var result = keywordSearch(globalIndex, searchterm);
        if (result == null && globalIndex > 0) { //loop back to beginning
            globalIndex = 0;
            result = keywordSearch(globalIndex, searchterm);
        }

        if (result == null) {
            alert("the search keyword: " + searchterm + " is not found!");

        } else {
            alert(result.content);
            globalStartSeconds = convertToSeconds(result.start);
            alert("start second is:" + globalStartSeconds);
            
            //player.reload
            if (player == null) { //player has not been created
                videoIdExternal = "zZWsAze9iVI";
                generatePlayer();
            } else {//player was not there or was already there
      
                player.loadVideoById("zZWsAze9iVI", globalStartSeconds);
                player.playVideo();
            
            }
            
            globalIndex = result.index;
        }
    });

}

function keywordSearch (index, keyword) {

    if(fuzhou1Json == null || fuzhou1Json.length <= index) {
        return null;
    }

    let searchArr = fuzhou1Json.slice(index); // slice starting from the index

    for (let i = index; i < searchArr.length; i++) { // looping through the json array starting from index
        let contentStr = searchArr[i].content; 
        // checking if the search keyword exists in the content string
        if (contentStr.includes(keyword)) {
            return searchArr[i];
        }
    }

    return null;
}


function generatePlayer() {
    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

}

function convertToSeconds(t) {
    let hrs = parseInt(t.split(':')[0], 10);
    let mins = parseInt(t.split(':')[1], 10);
    let secs = parseInt(t.split(':')[2], 10);
    return hrs * 3600 + mins * 60 + secs;
};