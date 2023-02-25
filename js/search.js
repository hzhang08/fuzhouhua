var globalIndex = 0;
var fuzhou1Json = null;

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