/**
 * @author Li Chunhui
 */
var halfAuto = true;
var storage = chrome.storage.local;
var debugMode = false;
var IPONumber = "";
var IPOCount = "";
var YC_Main = "chinacu.bsgroup.com.hk/mts.web/client/BSMARTLoginDisclaimer.aspx";
var YC_IPOApply = "chinacu.bsgroup.com.hk/bsmart.web/IPOInput.aspx";


chrome.commands.onCommand.addListener(function (command) {
    if (command == "half-auto") {
        console.log(getNowFormatDate() + "Press alt2");
        halfAuto = true;
        saveCommand();
    } else if (command == "star-fill") {
        console.log(getNowFormatDate() + "Press alt1");
        halfAuto = false;
        saveCommand();
        createTab(function () {
            sendMessage("start");
        });
    }
});

saveCommand();
listenMessages();

function saveCommand() {
    //init data
    storage.set({halfAuto: halfAuto});
}

function GetConfig() {
    storage.get(['config'], function (o) {
        if (o.hasOwnProperty('config')) {
            var config = o['config'];
            IPONumber = config.IPONumber;
            IPOCount = config.IPOCount;
            debugMode = config.debug;
        }
    });
}

function createTab(callback) {
    chrome.tabs.query({}, function (tabs) {
        var haveNew = false;
        $.each(tabs, function (i, tab) {
            if (tab.url.indexOf(YC_Main) > -1 || tab.url.indexOf(YC_IPOApply) > -1)
                haveNew = true;
        });
        if (!haveNew) {
            chrome.tabs.create({url: "https://" + YC_Main, active: true});
        }
        callback(haveNew);
    });
}

/**
 * 监听消息请求
 */
function listenMessages() {
    chrome.runtime.onMessage.addListener(function (msg) {
        if (!msg || !msg.cmd) {
            console.error("unsupported command:", msg);
            return;
        }
        switch (msg.cmd) {
            case "saveConfig":
                GetConfig();
                break;
            default :
                break;
        }
    });
}

function sendMessage(cmd, data){
    chrome.runtime.sendMessage({cmd: cmd, data: data}, function(response) {

    });
}

function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return "[" + currentdate + "]";
}