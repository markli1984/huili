/**
 * @author Li Chunhui
 */

// location.href 是这些时，执行对应的功能
var YC_Login = "https://chinacu.bsgroup.com.hk/trading/pns/bsmart/login/gb/login_BSS.aspx";
var YC_Main = "chinacu.bsgroup.com.hk/mts.web/client/BSMARTLoginDisclaimer.aspx";
var YC_IPOListRedirect = "https://chinacu.bsgroup.com.hk/mts.web//Redirect.aspx?url=%2fbsmart.web%2fLogin.aspx%3fsite%3dBSMART%26user%3d%7buser%7d%26language%3d%7blang%7d%26token%3d%7bayers_id%7d%26homePage%3d%2fbsmart.web%2fIPOList.aspx";
var YC_IPOlist = "chinacu.bsgroup.com.hk/bsmart.web/IPOList.aspx";
var YC_IPOApply = "chinacu.bsgroup.com.hk/bsmart.web/IPOInput.aspx";

var storage = chrome.storage.local;
var halfAuto = true;
var debugMode = true;
var IPONumber = "";
var IPOCount = "";
var autoFreshOpen = true;
var reloadTime = 10;

//快捷键
chrome.runtime.onMessage.addListener(function(msg){
	if(!msg || !msg.cmd) {
		console.error("unsupported command:", msg);
		saveLog("unsupported command:");
		return;
	}
	switch(msg.cmd) {
		case "start":
			halfAuto = false;
            autoFreshOpen = true;
			main();
			break;
		case "halfAuto":
			halfAuto = true;
			autoFreshOpen = false;
			main();
			break;
		default :
			break;
	}
});

function init(){
	initCommand(function(){
		main();
	});
}

function initCommand(callback){
	storage.get(["halfAuto"], function (o) {
		if (o.hasOwnProperty('halfAuto')) {
			halfAuto = o['halfAuto'];
		}
		callback();
	});
}

function main(){
	storage.get(['config'], function (o) {
		if (o.hasOwnProperty('config')) {
			var config = o['config'];
			IPONumber = config.IPONumber;
			IPOCount = config.IPOCount;
			debugMode = config.debug;
			checkUrl();
		}
	});
}

function checkUrl() {
	var url = location.href;
	//var title = $('title').text() || "";

	if (url.toLowerCase().indexOf(YC_Main.toLowerCase()) > -1) {
		GotoUrl(YC_IPOListRedirect);
	} else if (url.toLowerCase().indexOf(YC_IPOlist.toLowerCase()) > -1) {
		selectIPO();
	} else if (url.toLowerCase().indexOf(YC_IPOApply.toLowerCase()) > -1) {
		fillIPO();
	}

	console.log(url);
}

function GetQueryString(url, name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = url.match(reg);
	if (r != null)
		return r[2];
	return null;
}

function GotoUrl(url) {
	location.href = url;
}

function freshPage() {
	var url = location.href;
	GotoUrl(url);
}

function autoFresh(){
	if (autoFreshOpen && url.toLowerCase().indexOf(YC_IPOApply.toLowerCase()) > -1) {
		if($("input[name='btnApply']")){
			setTimeout(function () {
				freshPage();

				autoFresh();
			}, 30000);
		}
	}
}

function checkLogin(){
	var content = $("*").html();
	if (content.indexOf("登入已無效,請重新登入") > -1) {
		GotoUrl(YC_Login);
		return false;
	}
	return true;
}

function selectIPO(){
	try {
		if (checkLogin()) {
			var url = $("table #gridIPO tr:contains(" + IPONumber + ")").children(":first").children("a")[0].href
			url = url.replace("IPODisclaimer.aspx", "IPOInput.aspx");
			GotoUrl(url);
		}
	} catch (err) {
		console.error(err);
		//freshPage();
	}
}


function fillIPO() {
	try {
		if (checkLogin()) {
			if($("#rbMargin")){
				$("#rbMargin").click();

				var inputPair = [];
				inputPair.push({
					inputid: "qty",
					value: IPOCount
				});

				//$("qty option[value='1000']").attr('selected', true);
				fillTable(inputPair);

				//$("input[name='btnApply']").click();
			} else {
				autoFresh();
			}
		}
	} catch (err) {
		console.error(err);
		//freshPage();
	}
}

function fillTable(inputPair) {
	for (var i = 0; i < inputPair.length; i++) {
		if ($("#" + inputPair[i].inputid).length > 0) {
			$("#" + inputPair[i].inputid).val(inputPair[i].value);
		}
	}
}

function saveLog(log){
	storage.get(['Logs'], function (o) {
		if (o.hasOwnProperty('Logs')) {
			var Logs = o['Logs'];
			Logs.push(log);
			storage.set({Logs: Logs});
		}
	});
}


function sendMessage(cmd, data, name){
	chrome.runtime.sendMessage({cmd: cmd, data: data, name: name}, function(response) {
		console.error(response);
		saveLog(response);
	});
}

init();