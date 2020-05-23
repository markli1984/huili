/**
 * @author Li Chunhui
 */


$(function(){
    $('#home').on('click', function(){
        chrome.tabs.create({url: "chrome://extensions/", active: true});
    });
});
