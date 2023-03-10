
var vue = new Vue({
    el: "#main-container",
    data: {
        fuzhou1Json: null,
        player: null,
        videoIdExternal: null,
        globalStartSeconds: -1,
        subtitle: null, //deprecating this
        subtitleHtml: null
    },
    methods: {
        search: function() {
            historyStack.doPurge();
            init();
            
        },
        replay: function() {
            if (vue.globalStartSeconds >= 0) {
                vue.player.loadVideoById("zZWsAze9iVI", vue.globalStartSeconds);
                vue.player.playVideo();
            }
        },
        next: function() {
            init();
        }, 
        previous: function() {
            if(historyStack.isEmpty() || historyStack.peek() == 0) {
              //if the stack is empty or the current index is 0, then there is no previous search
                return;
            }
            historyStack.pop(); //pop the current search
            if(historyStack.isEmpty()) {
                return;
            }
            historyStack.pop(); //pop the previous search
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

    vue.player.loadVideoById("zZWsAze9iVI", vue.globalStartSeconds);
    vue.player.playVideo();
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
        vue.fuzhou1Json = json;
        let searchterm = document.getElementById("searchbox").value;

        if(historyStack.isEmpty()) {
            historyStack.push(0);
        }

        var result = keywordSearch(historyStack.peek(), searchterm);
        if (result == null && historyStack.peek() > 0) { //loop back to beginning

            historyStack.doPurge(); //clear the stack, so not to allow user to go back to the previous loop
            historyStack.push(0);  
            result = keywordSearch(historyStack.peek(), searchterm);
        }

        if (result == null) {
            vue.subtitleHtml = null;
            alert("the search keyword: " + searchterm + " is not found!");

        } else {

            let subtitleArray = splitStringByKeyword(result.content, searchterm);

            vue.subtitleHtml = concatenateObjectsToString(subtitleArray);

            vue.globalStartSeconds = convertToSeconds(result.start);
            
            //player.reload
            if (vue.player == null) { //player has not been created
                vue.videoIdExternal = "zZWsAze9iVI";
                generatePlayer();
            } else {//player was not there or was already there
      
                vue.player.loadVideoById("zZWsAze9iVI", vue.globalStartSeconds);
                vue.player.playVideo();
            
            }
            
            historyStack.push(result.index);
        }
    });

}

function keywordSearch (index, keyword) {

    if(vue.fuzhou1Json == null || vue.fuzhou1Json.length <= index) {
        return null;
    }

    let searchArr = vue.fuzhou1Json.slice(index); // slice starting from the index

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






  const historyStack = {
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
