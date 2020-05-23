/**
 * @author Li Chunhui
 */
// location.href 是这些时，执行对应的功能
var WHV_CHECK_TABLE = "https://onlineservices.immigration.govt.nz/WorkingHoliday/";
var WHV_SUBMIT_TABLE = "https://onlineservices.immigration.govt.nz/WorkingHoliday/Application/Submit.aspx?ApplicationId=";
var WHV_PAY_TABLE = "https://onlineservices.immigration.govt.nz/WorkingHoliday/Application/Pay.aspx?Token=";
var WHV_URL_HOME = "immigration.govt.nz/migrant/default.htm";
var WHV_URL_FIRST = "https://onlineservices.immigration.govt.nz/secure/Login+Working+Holiday.htm";
var WHV_URL = "immigration.govt.nz";
var PAY_URL = "https://webcomm.paymark.co.nz";

var storage = chrome.storage.local;
var currentUser = {index: 0, user: null};
var halfAuto = false;
var halfAuto1 = false;
var post = true;
var COUNTRY_ID = "130";//test 82 china 46

function init(){
	initCommand(function(){
		main(true);
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

function main(checkha){
	storage.get(['currentUser', 'config'], function (o) {
		if (o.hasOwnProperty('currentUser') && o.hasOwnProperty('config')) {
			currentUser = o['currentUser'];
			var config = o['config'];
			post = config.post;
			COUNTRY_ID = config.cid;
			checkUrl(currentUser.user, checkha);
		}
	});
}

function checkUrl(user) {
	//check half-auto
	if (halfAuto) {
		return;
	}

	var url = location.href;
	if (url.toLowerCase().indexOf("error") > -1 || url.toLowerCase().indexOf("accessdenied") > -1
		|| (url.indexOf(WHV_URL) === -1 && url.indexOf(PAY_URL) === -1)) {
		if(user.status !== 9){
			startLoginPage();
			return;
		}
	}
	if (url.toLowerCase().indexOf(WHV_URL_FIRST.toLowerCase()) > -1) {
		if (post && !halfAuto) {
			//sendMessage("postLogin", user);
		}
	} else if (url.toLowerCase().indexOf(WHV_URL_HOME.toLowerCase()) > -1) {
		user.status = 1;
		sendMessage("loginStatus", user);
		if(halfAuto){
			return;
		}

		if (user.status >= 2) {
			//have table
			if (user.tableEditUrl) {
				if (user.status === 7) {
					GotoUrl(WHV_SUBMIT_TABLE + user.ApplicationID, false);
				} else if (user.status === 8) {
					GotoUrl(WHV_PAY_TABLE + user.Token);
				} else {
					GotoUrl(user.tableEditUrl);
				}
			}
		} else {
			//no table
			GotoUrl(WHV_CHECK_TABLE);
		}
	} else if (url.toLowerCase().indexOf(WHV_PAY_TABLE.toLowerCase()) > -1) {
        var aID = GetApplicationId(url);
		var goUrl = "https://onlineservices.immigration.govt.nz/PaymentGateway/OnLinePayment.aspx?SourceUrl=https://onlineservices.immigration.govt.nz/WorkingHoliday/Application/SubmitConfirmation.aspx?ApplicationId=";
		goUrl += aID + "&ApplicationId=" + aID + "&ProductId=2";
		GotoUrl(goUrl);
	} else if (url.toLowerCase().indexOf("immigration.govt.nz/WorkingHoliday/Wizard/Personal1.aspx?ApplicationId=".toLowerCase()) > -1) {
		user.status = 2;
		user.ApplicationID = GetApplicationId(url);
		user.tableEditUrl = "https://onlineservices.immigration.govt.nz/WorkingHoliday/Wizard/Personal1.aspx?ApplicationId="
			+ user.ApplicationID + "&IndividualType=Primary&IndividualIndex=1";
		updateUserInfo(user);

		if (post && !halfAuto) {
			sendMessage("postTable", user.ApplicationID);
		}
	} else {
		console.log(url);
	}
}

function GotoUrl(url) {
	location.href = url;
}

function startLoginPage() {
	location.href = WHV_URL_FIRST;
}

function GetApplicationId(tabUrl) {
	var index = tabUrl.indexOf("?");
	tabUrl = tabUrl.substr(index, tabUrl.length - index).substr(1);
	return GetQueryString(tabUrl, "ApplicationId");
}

function GetQueryString(url, name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = url.match(reg);
	if (r != null){
		return r[2];
	}
	return null;
}

function updateUserInfo (user) {
	storage.get(['currentUser', 'users'], function (o) {
		if (o.hasOwnProperty('currentUser') && o.hasOwnProperty('users')) {
			var users = o['users'];
			for (var i = 0; i < users.length; i++) {
				if (users[i].name === user.name) {
					users[i] = user;
					break;
				}
			}
			var currentUser = o['currentUser'];
			currentUser.user = user;
			storage.set({currentUser: currentUser});
			storage.set({users: users});
		}
	});
}

function sendMessage(cmd, data){
	chrome.runtime.sendMessage({cmd: cmd, data: data}, function(response) {
		console.error(response);
	});
}

init();