/**
 * @author Li Chunhui
 */
// location.href 是这些时，执行对应的功能
var WHV_PAYER_DETAIL = "immigration.govt.nz/PaymentGateway/OnLinePayment.aspx";

var storage = chrome.storage.local;
var currentUser = {index: 0, user: null};
var halfAuto = false;
var halfAuto1 = false;
var post = false;

function init(){
	initCommand(function(){
		main();
	});
}

function initCommand(callback){
	storage.get(["halfAuto", "halfAuto1"], function (o) {
		if (o.hasOwnProperty('halfAuto') && o.hasOwnProperty('halfAuto1')) {
			halfAuto = o['halfAuto'];
			halfAuto1 = o['halfAuto1'];
		}
		callback();
	});
}

function main(){
	storage.get(['currentUser', 'config'], function (o) {
		if (o.hasOwnProperty('currentUser') && o.hasOwnProperty('config')) {
			currentUser = o['currentUser'];
			var config = o['config'];
			post = config.post;
			setTimeout(checkUrl(currentUser.user), 1000);
		}
	});
}

function checkUrl(user) {
	//check half-auto
	if (halfAuto) {
		return;
	}

	var url = location.href;
	var title = $('title').text() || "";
	if (url.toLowerCase().indexOf(WHV_PAYER_DETAIL.toLowerCase()) > -1 && title.toLowerCase().indexOf("Payer Details".toLowerCase()) > -1) {
		user.status = 8;
		sendMessage("updateUserStatus", user);
		user.ApplicationID = GetApplicationId(url);
		payerDetail(user, user.ApplicationID);
	} else {
		console.log(url);
	}
}

function payerDetail (user, aID) {
	if (post) {
		sendMessage("postPay", aID, user.name);
		return;
	}

	if ($("#ctl00_ContentPlaceHolder1_okImageButton").length > 0) {
		$("#ctl00_ContentPlaceHolder1_payorNameTextBox").val(user.userinfo.payName);

		if (!halfAuto) {
			$("#ctl00_ContentPlaceHolder1_okImageButton").click();
		}
		return;
	}

	if ($("#ctl00_ContentPlaceHolder1_errorMessageLabel").text().indexOf("Unfortunately the available places for this Working Holiday Scheme have been filled")) {
		/*var refreshTime = rd(rr1, rr2);
		 setTimeout(function () {
		 freshPage();
		 }, refreshTime);*/
		halfAuto = true;
		storage.set({halfAuto: halfAuto});
		freshPage();
	}
}

function GetApplicationId(tabUrl) {
	var index = tabUrl.indexOf("?");
	tabUrl = tabUrl.substr(index, tabUrl.length - index).substr(1);
	return GetQueryString(tabUrl, "ApplicationId");
}

function GetQueryString(url, name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = url.match(reg);
	if (r != null)
		return r[2];
	return "";
}

function sendMessage(cmd, data){
	chrome.runtime.sendMessage({cmd: cmd, data: data}, function(response) {
		console.error(response);
	});
}

init();