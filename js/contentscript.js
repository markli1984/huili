/**
 * @author Li Chunhui
 */

var storage = chrome.storage.local;
var halfAuto = true;
var debugMode = true;

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
			main();
			break;
		case "halfAuto":
			halfAuto = true;
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
			debugMode = config.debug;
            checkContent();
		}
	});
}

function checkContent(){
    var content = $("*").html();
    if (content.indexOf("新股輸入") > -1 || content.indexOf("新股输入") > -1 ) {
        selectCount();
    } else {
        selectShare();
    }
}

//选择新股
function selectShare(){
    var shares = $(".ClickButton");
    if (shares.length > 0){
        shares[0].click();
        setTimeout(function () {
            selectCount();
        }, 100);
    }
}

//选择数量
function selectCount(){
	var inputPair = [];
	inputPair.push({
		inputid: "BQty",
		value: "5"
	});
	inputPair.push({
		inputid: "OrderSide",
		value: "5"
	});
	if($("input[value='提交']").length > 0){
	    if(!debugMode){
            $("input[value='提交']").click();
        }
    }

	fillTable(inputPair);
}

function checkUrl(user, checkha) {
	var url = location.href;
	var title = $('title').text() || "";

	console.log(url);
}

function freshPage() {
	var url = location.href;
	GotoUrl(url);
}

function GotoUrl(url) {
	location.href = url;
}

function fillPersonal(user) {
	try {
		var inputPair = [];
		inputPair.push({
			inputid: "ContentPlaceHolder1_personDetails_genderDropDownList",
			value: user.userinfo.gender.substr(0, 1).toUpperCase()
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_address_countryDropDownList",
			value: COUNTRY_ID//user.userinfo.addressCountry
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_contactDetails_emailAddressTextBox",
			value: user.userinfo.email
		});
	} catch (err) {
		console.error(err);
		freshPage();
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

//init();
checkContent();