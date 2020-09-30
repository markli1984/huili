/**
 * @author Li Chunhui
 */
var halfAuto = true;
var storage = chrome.storage.local;
var debugMode = false;
var autoStart = false;
var IPONumber = "";
var IPOCount = "";
var reloadTime = 10;


chrome.commands.onCommand.addListener(function (command) {
    if (command == "half-auto") {
        console.log(getNowFormatDate() + "Press alt2");
        halfAuto = true;
        saveCommand();
        sendMessage("halfAuto");
    }
});

saveCommand();
listenMessages();
checkStart();

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
            if (tab.url.indexOf(WHV_URL) > -1 || tab.url.indexOf(PAY_URL) > -1)
                haveNew = true;
        });
        if (!haveNew) {
            chrome.tabs.create({url: WHV_URL_FIRST, active: true});
        }
        callback(haveNew);
    });
}

function sendMessage(cmd, data) {
    //send message
    chrome.tabs.query({url: ["*://*.immigration.govt.nz/*", "*://webcomm.paymark.co.nz/hosted/*"]}, function (tabs) {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {cmd: cmd, data: data}, function (response) {
                console.log(getNowFormatDate() + cmd + " : " + response);
            });
        }
    });
}

function gotoUrl(url) {
    console.log(getNowFormatDate() + "go to url " + url);
    chrome.tabs.query({url: ["*://*.immigration.govt.nz/*"]}, function (tabs) {
        if (tabs.length > 0) {
            chrome.tabs.executeScript(tabs[0].id, {
                code: 'location.href = "' + url + '"'
            });
        }
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

function checkStart() {
    setTimeout(function () {
        var now = new Date();
        if (now.getHours() !== 0) {
            if (now.getHours() === startHour && now.getMinutes() === startMinute && now.getSeconds() === 0) {
                halfAuto = false;
                halfAuto1 = false;
                saveCommand();
                console.log(getNowFormatDate() + "Auto Start!!!!-----------------------------------");
                sendMessage("start");
            }
        }

        checkStart();
    }, 1000);
}

function GetQueryString(url, name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = url.match(reg);
    if (r != null)
        return r[2];
    return null;
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

function rd(n, m) {
    var c = m - n + 1;
    return Math.floor(Math.random() * c + n);
}