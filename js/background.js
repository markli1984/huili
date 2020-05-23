/**
 * @author Li Chunhui
 */
var halfAuto = true;
var halfAuto1 = false;
var storage = chrome.storage.local;
var debugMode = false;
var WHV_URL_FIRST = "https://onlineservices.immigration.govt.nz/secure/Login+Working+Holiday.htm";
var WHV_CHECK_TABLE = "https://onlineservices.immigration.govt.nz/WorkingHoliday/";
var WHV_URL = "immigration.govt.nz";
var PAY_URL = "https://webcomm.paymark.co.nz";
var VPS_IP = "_ch";
var telephone = "13629262402;15029249426;13986226745";
var reloadTime = 10;
var autoStart = false;
var SMS1 = false;
var rr1 = 0;
var rr2 = 10;
var refreshWord = "no scheme open;Unfortunately";
var successDelete = true;
var startDate;
var startPayDate;
var startSubmitDate;

var COUNTRY_ID = "130";//test 82 china 46
var startHour = "10";
var startMinute = "0";
var post = false;
var postCreatCount = 10;


chrome.commands.onCommand.addListener(function (command) {
    if (command == "half-auto") {
        console.log(getNowFormatDate() + "Press alt2");
        halfAuto = true;
        halfAuto1 = false;
        saveCommand();
        sendMessage("halfAuto");
    }
});

saveCommand();
listenMessages();
checkStart();
setProxy();

function saveCommand() {
    //init data
    storage.set({halfAuto: halfAuto});
    storage.set({halfAuto1: halfAuto1});
}

function GetConfig() {
    storage.get(['config'], function (o) {
        if (o.hasOwnProperty('config')) {
            var config = o['config'];
            WHV_URL_FIRST = config.fp;
            VPS_IP = config.ip;
            debugMode = config.debug;
            telephone = config.telephone;
            reloadTime = config.reloadTime;
            autoStart = config.autoStart;
            COUNTRY_ID = config.cid;
            SMS1 = config.SMS1;
            rr1 = config.rr1;
            rr2 = config.rr2;
            refreshWord = config.refeshWord;
            startHour = config.startHour;
            startMinute = config.startMinute;
            post = config.post;
            postCreatCount = config.postCreatCount;
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

function setProxy() {
    var pac = "var FindProxyForURL = function(url, host){" +
        "if(shExpMatch(url, '*immigration\.govt\.nz*'))" +
        "{" +
        "return 'PROXY http://67fc50e57b9048359b50c1d7172f6dc2:@proxy.crawlera.com:8010';" +
        "}" +
        "return 'PROXY http://proxy.crawlera.com:8010';" +
        //"return 'DIRECT'" +
        "}";

    var config = {
        mode: "pac_script",
        pacScript: {
            data: pac
        }
    };

    chrome.proxy.settings.set({value: config, scope: 'regular'}, function (a) {
        console.log(a);
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
            case "updateUserStatus":
                updateUserStatus(msg.data);
                break;
            case "loginStatus":
                updateUserStatus(msg.data);
                saveLoginCookie(msg.data.name);
                break;
            case "clearCookies":
                clearCookies(function () {
                    sendMessage("restoreOK");
                });
                break;
            case "haveTable":
                updateUserStatus(msg.data);
                sendMessage("gotoCheck");
                break;
            case "saveConfig":
                GetConfig();
                break;
            case "skipUser":
                storage.get(['currentUser'], function (o) {
                    if (o.hasOwnProperty('currentUser')) {
                        var currentUser = o['currentUser'];
                        updateUserInfo(msg.data, currentUser.user.name === msg.data.name, function () {
                            if (currentUser.user.name === msg.data.name && msg.data.skip) {
                                getNextUser(false, function (result) {
                                    if (result) {
                                        sendMessage("NextUser");
                                    } else {
                                        notify("All user finish.", "All user finish.");
                                        setBookmark("All Finish!");
                                    }
                                });
                            }
                        });
                    }
                });
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

function checkTableFinish(aID, finishIndex) {
    storage.get(['currentUser'], function (o) {
        var user = o['currentUser'].user;
        if (finishIndex === 2) {
            user.successPerson2 = true;
        } else if (finishIndex === 3) {
            user.successMedical = true;
        } else if (finishIndex === 4) {
            user.successCharacter = true;
        } else if (finishIndex === 5) {
            user.successSpecial = true;
        }
        if (user.successPerson1 && user.successPerson2 && user.successMedical && user.successCharacter && user.successSpecial) {
            if (!user.successSubmit) {
                var submitUrl = "https://onlineservices.immigration.govt.nz/WORKINGHOLIDAY/Application/Submit.aspx?ApplicationId=" + aID;
                gotoUrl(submitUrl);
                user.status = 7;
                updateUserStatus(user);
                postSubmit(aID);
            } else {
                console.log(getNowFormatDate() + "table have Submit!!!");
            }
        }
    });
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