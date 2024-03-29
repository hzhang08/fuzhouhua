
var vue = new Vue({
    el: "#main-container",
    data: {
        fuzhou1Json: null,
        player: null,
        videoIdExternal: null,
        globalStartSeconds: -1,
        globalVideoId: null,
        subtitle: null, //deprecating this
        subtitleHtml: null
    },
    methods: {
        search: function() {
            indexHistoryStack.doPurge();
            init();
            
        },
        replay: function() {
            if (vue.globalStartSeconds >= 0) {

                vue.player.loadVideoById(vue.globalVideoId, vue.globalStartSeconds);
                vue.player.playVideo();
            }
        },
        next: function() {
            init();
        }, 
        previous: function() {
            if(indexHistoryStack.isEmpty() || indexHistoryStack.peek() == 0) {
              //if the stack is empty or the current index is 0, then there is no previous search
                return;
            }
            indexHistoryStack.pop(); //pop the current search
            if(indexHistoryStack.isEmpty()) {
                return;
            }
            indexHistoryStack.pop(); //pop the previous search
            init();
        },
        pause: function() {
            vue.player.pauseVideo();
        }
        
    }
});

function onYouTubeIframeAPIReady() {
    vue.player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: vue.videoIdExternal,
        playerVars: {
        'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {

    vue.player.loadVideoById(vue.globalVideoId, vue.globalStartSeconds);
    vue.player.playVideo();
}



function init() {

    fetch('./subtitles.json')
    .then((response) => response.json())
    .then((json) => {
        vue.fuzhou1Json = json;
        let searchterm = document.getElementById("searchbox").value;

        if(indexHistoryStack.isEmpty()) {
            // we want to start searching from 0, so we push 0 to the stack
            indexHistoryStack.push(0);
        }

        var result = keywordSearch(indexHistoryStack.peek(), searchterm);
        if (result == null && indexHistoryStack.peek() > 0) { //loop back to beginning

            indexHistoryStack.doPurge(); //clear the stack, so not to allow user to go back to the previous loop
            indexHistoryStack.push(0);  
            result = keywordSearch(indexHistoryStack.peek(), searchterm);
        }

        if (result == null) {
            vue.subtitleHtml = null;
            alert("the search keyword: " + searchterm + " is not found!");

        } else {

            let subtitleArray = splitStringByKeyword(result.content, searchterm);

            vue.subtitleHtml = concatenateObjectsToString(subtitleArray);

            vue.globalStartSeconds = convertToSeconds(result.start);
            
            //be careful because i is lowercase in result.videoid
            vue.globalVideoId = result.videoid;
            
            //player.reload
            if (vue.player == null) { //player has not been created
                //be careful because i is lowercase in result.videoid
                vue.videoIdExternal = result.videoid;
                generatePlayer();
            } else {//player was not there or was already there
                //be careful because i is lowercase in result.videoid
                vue.player.loadVideoById(result.videoid, vue.globalStartSeconds);
                vue.player.playVideo();
            
            }
            
            indexHistoryStack.push(result.index);
        }
    });

}

function keywordSearch (index, keyword) {

    //the assumption should be, index is previously searched index, so searching starting from the next index
    //for initial search, index should be 0, so we start from 0

    if(vue.fuzhou1Json == null || vue.fuzhou1Json.length <= index) {
        return null;
    }

    //the index needs to not to be +1, because the .srt index starts from 1, but the array index starts from 0
    let searchArr = vue.fuzhou1Json.slice(index); // slice starting from the index

    for (let i = 0; i < searchArr.length; i++) { // looping through the json array starting from index
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

function splitStringByKeyword(sourceString, keyword) {
    let splitArray = [];
    let index = 0;
  
    while (index < sourceString.length) {
      let currentText = "";
      let currentIsKey = false;
  
      if (sourceString.slice(index, index + keyword.length) === keyword) {
        currentText = keyword;
        currentIsKey = true;
        index += keyword.length;
      } else {
        currentText += sourceString[index];
  
        let nextIndex = index + 1;
        while (nextIndex < sourceString.length && sourceString.slice(nextIndex, nextIndex + keyword.length) !== keyword) {
          currentText += sourceString[nextIndex];
          nextIndex += 1;
        }
  
        index = nextIndex;
      }
  
      splitArray.push({ text: currentText, isKey: currentIsKey });
    }
  
    return splitArray;
  }
  
  function concatenateObjectsToString(array) {
    let resultString = "";
  
    for (let i = 0; i < array.length; i++) {
      const object = array[i];
      if (object.isKey) {
        resultString += `<p class="bg-danger text-white fs-3">${object.text}</p>`;
      } else {
        resultString += object.text;
      }
    }
  
    return resultString;
  }






  const indexHistoryStack = {
    data: [],
  
    push: function(value) {
      this.data.push(value);
    },
  
    pop: function() {
      return this.data.pop();
    },
  
    peek: function() {
      return this.data[this.data.length - 1];
    },
  
    isEmpty: function() {
      return this.data.length === 0;
    },

    doPurge: function() {
        this.data = [];
    },

    getSize: function() {
        return this.data.length;
    }
  };
