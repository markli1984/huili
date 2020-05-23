/**
 * @author Li Chunhui
 */
// location.href 是这些时，执行对应的功能
var WHV_CHECK_TABLE = "immigration.govt.nz/WorkingHoliday/";
var WHV_URL_HOME = "immigration.govt.nz/migrant/default.htm";

var storage = chrome.storage.local;
var currentUser = {index: 0, user: null};
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
			main(true);
			break;
		case "halfAuto":
			halfAuto = true;
			main(false);
			break;
		case "gotoCheck":
			GotoUrl("https://onlineservices." + WHV_CHECK_TABLE);
			break;
		case "goUrl":
			GotoUrl(msg.data);
			break;
		default :
			break;
	}
});

function init(){
	initCommand(function(){
		main(true);
	});
}

function initCommand(callback){
	storage.get(["halfAuto", "halfAuto1"], function (o) {
		if (o.hasOwnProperty('halfAuto') && o.hasOwnProperty('halfAuto1')) {
			halfAuto = o['halfAuto'];
		}
		callback();
	});
}

function main(checkha){
	storage.get(['currentUser', 'config'], function (o) {
		if (o.hasOwnProperty('currentUser') && o.hasOwnProperty('config')) {
			currentUser = o['currentUser'];
			var config = o['config'];
			debugMode = config.debug;
			COUNTRY_ID = config.cid;
			WHV_URL_FIRST = config.fp;
			checkUrl(currentUser.user, checkha, false);
		}
	});
}

function checkInvalid() {
	if ($("*").html().toLowerCase().indexOf("invalid request") > -1) {
		saveLog("invalid request!!!");
		sendMessage("clearCookies");
		return false;
	}
	return true;
}

function checkUrl(user, checkha) {
	var url = location.href;
	var title = $('title').text() || "";

	if(!checkInvalid()){
		return;
	}

	if (url.toLowerCase().indexOf(WHV_PAY_RESULT.toLowerCase()) > -1) {
		checkResult(user);
		return;
	}

	//check half-auto
	if (checkha && (halfAuto || halfAuto1)) {
		return;
	}

	if(user.status === 10 || user.skip) {
		user.skip = true;
		sendMessage("skipUser", user);
		return;
	}

	if (url.toLowerCase().indexOf("error") > -1 || url.toLowerCase().indexOf("accessdenied") > -1
		|| (url.indexOf(WHV_URL) === -1 && url.indexOf(PAY_URL) === -1)) {
		if(user.status !== 9){
			sendMessage("restoreLog", "", user.name);
			return;
		}
	} else if (title.toLowerCase().indexOf("problem loading page") > -1 || title.toLowerCase().indexOf("error") > -1 ||
		title.toLowerCase().indexOf("无法访问") > -1) {
		if(user.status !== 9){
			startLoginPage();
			return;
		}
	}
	if (url.toLowerCase().indexOf(WHV_LOGIN_ADDR.toLowerCase()) > -1 || url.toLowerCase().indexOf(WHV_LOGIN_ADDR1.toLowerCase()) > -1 ||
		url.toLowerCase().indexOf(SFV_LOGIN_ADDR.toLowerCase()) > -1 || url.toLowerCase().indexOf(WHV_LOGIN_ADDR2.toLowerCase()) > -1 ||
		url.toLowerCase().indexOf(WHV_LOGIN_ADDR3.toLowerCase()) > -1) {
		login(user);
	} else if (url.toLowerCase().indexOf(WHV_URL_HOME.toLowerCase()) > -1) {
		user.status = 1;
		updateUserInfo(user);
		if(halfAuto){
			return;
		}

		if (user.status >= 2) {
			//have table
			if (user.tableEditUrl) {
				if (user.status === 7) {
					GotoUrl("https://onlineservices." + WHV_SUBMIT_TABLE + user.ApplicationID);
				} else if (user.status === 8) {
					GotoUrl("https://onlineservices." + WHV_PAY_TABLE + user.ApplicationID);
				} else {
					GotoUrl(user.tableEditUrl);
				}
			}
			else {
				homeClick();
			}
		} else {
			//no table
			GotoUrl("https://onlineservices." + WHV_CHECK_TABLE);
		}
	} else if (url.toLowerCase().indexOf(WHV_CREATE_TABLE.toLowerCase()) > -1) {
		user.status = 1;
		updateUserInfo(user);
		createTable(user);
	} else if (url.toLowerCase().indexOf("immigration.govt.nz/WorkingHoliday/Wizard/Personal1.aspx?ApplicationId=".toLowerCase()) > -1) {
		user.status = user.status < 2 ? 2 : user.status;
		user.ApplicationID = GetApplicationId(url);
		user.tableEditUrl = "https://onlineservices.immigration.govt.nz/WorkingHoliday/Wizard/Personal1.aspx?ApplicationId="
			+ user.ApplicationID + "&IndividualType=Primary&IndividualIndex=1";
		updateUserInfo(user);

		fillPersonal(user);
	} else if (url.toLowerCase().indexOf(WHV_PAYER_DETAIL.toLowerCase()) > -1) {
		user.status = 8;
		user.Token = GetApplicationId(url, "Token");
		updateUserInfo(user);
		payerDetail(user, user.Token);
	} else if (url.toLowerCase().indexOf(PAY_URL.toLowerCase() + "/hosted") > -1 && title.toLowerCase().indexOf("Paymark Merchant Payment".toLowerCase()) > -1) {
		user.status = 9;
		updateUserInfo(user);
		cardPay(user);
	} else if (url.toLowerCase().indexOf(WHV_CHECK_TABLE.toLowerCase()) > -1 || url.toLowerCase().indexOf(WHV_CHECK_TABLE1.toLowerCase()) > -1) {
		checkTable(user);
	} else {
		console.log(url);
		saveLog("Unexpected url : " + url);
	}
}

function GetApplicationId(tabUrl, para) {
	var index = tabUrl.indexOf("?");
	tabUrl = tabUrl.substr(index, tabUrl.length - index).substr(1);
	if(!para){
		para = "ApplicationId";
	}
	return GetQueryString(tabUrl, para);
}

function GetQueryString(url, name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = url.match(reg);
	if (r != null)
		return r[2];
	return null;
}

function freshPage() {
	var url = location.href;
	GotoUrl(url);
}

function GotoUrl(url) {
	location.href = url;
}

function startLoginPage() {
	location.href = WHV_URL_FIRST;
}

function login(user) {
	if (!halfAuto) {
		user.token = $("input[name='__RequestVerificationToken']").val();
		sendMessage("postLogin", user);
		return;
	}

	var valid = $("input[name='username']").length > 0 && $("input[name='password']").length > 0
		&& $("input[type='submit']").length > 0;
	if (valid) {
		saveLog("Login at : " + getNowFormatDate());
		$("input[name='username']").val(user.userinfo.login);
		$("input[name='password']").val(user.userinfo.password);
		if(!halfAuto) {
			$("input[type='submit']").click();
		}
	} else {
		setTimeout(function () {
			checkUrl(user, false);
		}, 1000);
	}
}

function homeClick () {
	if($("#OnlineServices_workingHolidayAnchor").length > 0){
		$("#OnlineServices_workingHolidayAnchor").attr("onclick", "window.open('/WorkingHoliday/','WHS'); return false;");
		if(!halfAuto) {
			document.getElementById("OnlineServices_workingHolidayAnchor").click();
		}
	}
}

function checkTable(user) {
	var TABLE_ID = "ContentPlaceHolder1_applicationList_applicationsDataGrid";
	if ($("table#" + TABLE_ID).length > 0) {
		//have table
		var tableID = $("#ContentPlaceHolder1_applicationList_applicationsDataGrid_referenceNumberLabel_0").text();
		user.status = 2;
		user.successCreate = true;
		user.ApplicationID = tableID;
		updateUserInfo(user);

		//pay for table
		if ($("#ContentPlaceHolder1_applicationList_applicationsDataGrid_payHyperLink_0").length > 0) {
			user.successSubmit = true;
			user.successPerson1 = true;
			user.successPerson2 = true;
			user.successMedical = true;
			user.successCharacter = true;
			user.successSpecial = true;
			user.status = 8;
			updateUserInfo(user);
			if (!halfAuto) {
				sendMessage("postPay", null, user);
			}

			if (!halfAuto) {
				document.getElementById("ContentPlaceHolder1_applicationList_applicationsDataGrid_payHyperLink_0").click();
				return;
			}
		}

		//submit table
		if ($("#ContentPlaceHolder1_applicationList_applicationsDataGrid_submitHyperlink_0").length > 0) {
			user.successPerson1 = true;
			user.successPerson2 = true;
			user.successMedical = true;
			user.successCharacter = true;
			user.successSpecial = true;
			user.status = 7;
			updateUserInfo(user);
			if (post && !halfAuto) {
				sendMessage("postSubmit", tableID, user);
			}
			if (!halfAuto) {
				document.getElementById("ContentPlaceHolder1_applicationList_applicationsDataGrid_submitHyperlink_0").click();
				return;
			}
		}

		//edit table
		if ($("#ContentPlaceHolder1_applicationList_applicationsDataGrid_editHyperLink_0").length > 0) {
			if (post && !halfAuto) {
				sendMessage("postTable", tableID);
			}

			if (!halfAuto) {
				document.getElementById("ContentPlaceHolder1_applicationList_applicationsDataGrid_editHyperLink_0").click();
				return;
			}
		}

		//received whv visa
		/*if($("#ctl00_ContentPlaceHolder1_applicationList_applicationsDataGrid_ctl02_paymentStatusLabel").length > 0 &&
			$("#ctl00_ContentPlaceHolder1_applicationList_applicationsDataGrid_ctl02_paymentStatusLabel").text().indexOf("Received") > -1){
			user.status = 10;
			updateUserInfo(user);
			sendMessage("skipUser", user);
		}*/
	} else {
		if (post && !halfAuto) {
			storage.get(['currentUser'], function (o) {
				if (o.hasOwnProperty('currentUser')) {
					//clear table id stored in user
					var currentUser = o['currentUser'];
					currentUser.user.ApplicationID = null;
					storage.set({currentUser: currentUser});

					sendMessage("postCreate", user);
				}
			});
		}

		if (!halfAuto) {
			GotoUrl("https://onlineservices." + WHV_CREATE_TABLE + COUNTRY_ID);
		}
	}
}

function createTable(user) {
	if (post && !halfAuto) {
		sendMessage("postCreate", user.name);
	}

	if ($("#ctl00_ContentPlaceHolder1_applyNowButton").length > 0) {
		if(!halfAuto) {
			$("#ctl00_ContentPlaceHolder1_applyNowButton").click();
			return;
		}
	}

	if($("#ctl00_ContentPlaceHolder1_errorMessageLabel").length > 0){
		user.status = user.status < 2 ? 2 : user.status;
		sendMessage("haveTable", user);
		return;
	}

	if($("#ctl00_ContentPlaceHolder1_statusLabel").length > 0  &&
		$("#ctl00_ContentPlaceHolder1_statusLabel").text().indexOf("Unfortunately the available") > -1){
		halfAuto = true;
		storage.set({halfAuto: halfAuto});
		freshPage();
	}
}

function fillPersonal(user) {
	if (post && !halfAuto) {
		sendMessage("postTable", user.ApplicationID);
	}

	try {
		var inputPair = [];
		inputPair.push({
			inputid: "ContentPlaceHolder1_personDetails_familyNameTextBox",
			value: user.userinfo.familyName
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_personDetails_givenName1Textbox",
			value: user.userinfo.givenName
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_personDetails_genderDropDownList",
			value: user.userinfo.gender.substr(0, 1).toUpperCase()
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_personDetails_dateOfBirthDatePicker_DatePicker",
			value: transDate(user.userinfo.dateBirth)
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_personDetails_CountryDropDownList",
			value: COUNTRY_ID//user.userinfo.countryBirth
		});
		//$("#ctl00_ContentPlaceHolder1_personDetails_CountryDropDownList option[text='"+user.userinfo.countryBirth+"']").attr('selected',true);
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_address_address1TextBox",
			value: user.userinfo.streetName
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_address_suburbTextBox",
			value: user.userinfo.streetName//no field
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_address_cityTextBox",
			value: user.userinfo.city
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_address_countryDropDownList",
			value: COUNTRY_ID//user.userinfo.addressCountry
		});
		inputPair.push({
			inputid: "ContentPlaceHolder1_addressContactDetails_contactDetails_emailAddressTextBox",
			value: user.userinfo.email
		});
		inputPair.push({inputid: "ContentPlaceHolder1_hasAgent_representedByAgentDropdownlist", value: "No"});
		inputPair.push({inputid: "ContentPlaceHolder1_communicationMethod_communicationMethodDropDownList", value: "1"});
		inputPair.push({inputid: "ContentPlaceHolder1_hasCreditCard_hasCreditCardDropDownlist", value: "Yes"});
		fillTable(inputPair);

		if ($("#ContentPlaceHolder1_wizardPageFooter_wizardPageNavigator_submitImageButton").length > 0) {
			setTableMarkTrue(user);
			if (!halfAuto) {
				$("#ContentPlaceHolder1_wizardPageFooter_wizardPageNavigator_submitImageButton").click();
			}
			return;
		}

		if ($("#ContentPlaceHolder1_wizardPageHeader_nav_sectionTabs_TabHeaders_statusImage_0").attr("title") === "Completed") {
			user.status = 4;
			if ($("#ContentPlaceHolder1_wizardPageHeader_nav_sectionTabs_TabHeaders_statusImage_1").attr("title") != "Completed") {
				if (!halfAuto) {
					$("#ctl00_ContentPlaceHolder1_wizardPageHeader_nav_sectionTabs_TabHeaders_ctl01_tabButton").click();
				}
				return;
			}
			if ($("#ContentPlaceHolder1_wizardPageHeader_nav_sectionTabs_TabHeaders_statusImage_2").attr("title") != "Completed") {
				if (!halfAuto) {
					$("#ctl00_ContentPlaceHolder1_wizardPageHeader_nav_sectionTabs_TabHeaders_ctl02_tabButton").click();
				}
				return;
			}
			if (!halfAuto) {
				$("#ctl00_ContentPlaceHolder1_wizardPageHeader_nav_sectionTabs_TabHeaders_ctl03_tabButton").click();
			}
			return;
		}

		if ($("#ContentPlaceHolder1_wizardPageFooter_wizardPageNavigator_nextImageButton").length > 0) {
			if(!halfAuto){
				$("#ContentPlaceHolder1_wizardPageFooter_wizardPageNavigator_nextImageButton").click();
			}
		}
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

function transMonth(month){
	if (month === "01"){
		return "January";
	} else if (month === "02"){
		return "February";
	} else if (month === "03"){
		return "March";
	} else if (month === "04"){
		return "April";
	} else if (month === "05"){
		return "May";
	} else if (month === "06"){
		return "June";
	} else if (month === "07"){
		return "July";
	} else if (month === "08"){
		return "August";
	} else if (month === "09"){
		return "September";
	} else if (month === "10"){
		return "October";
	} else if (month === "11"){
		return "November";
	} else if (month === "12"){
		return "December";
	}
}

function transDate(date) {
	var strDate = Number(date.substr(6, 2)) + " " + transMonth(date.substr(4, 2)) + ", " + date.substr(0, 4);

	return strDate;
}

function setTableMarkTrue(){
    storage.get(['currentUser'], function (o) {
        var user = o['currentUser'].user;
        user.successPerson1 = true;
        user.successPerson2 = true;
        user.successMedical = true;
        user.successCharacter = true;
        user.successSpecial = true;
        if (post && !halfAuto) {
            sendMessage("postSubmit", GetApplicationId(location.href), user);
        }
    });
}

function checkResult(user){
	saveHtml(user);
	user.status = 10;
	updateUserInfo(user);
}

function saveHtml(user){
	storage.get(['pageLogs'], function (o) {
		if (o.hasOwnProperty('pageLogs')) {
			var pageLogs = o['pageLogs'];
			var isExist = false;
			for (var i = 0; i < pageLogs.length; i++) {
				if (pageLogs[0].Name === user.name) {
					isExist = true;
					pageLogs[0].Time = getNowFormatDate();
					pageLogs[0].PageContent = $("*").html();
				}
			}

			if (!isExist) {
				var page = {
					Name: user.name,
					Time: getNowFormatDate(),
					PageContent: $("*").html()
				};
				pageLogs.push(page);
			}
			storage.set({pageLogs: pageLogs});
		}
	});
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
	var currentDate = date.getFullYear() + seperator1 + month + seperator1 + strDate
		+ " " + date.getHours() + seperator2 + date.getMinutes()
		+ seperator2 + date.getSeconds();
	return currentDate;
}

function updateUserInfo (user) {
	storage.get(['currentUser', 'users'], function (o) {
		if (o.hasOwnProperty('currentUser') && o.hasOwnProperty('users')) {
			var users = o['users'];
			var currentUser = o['currentUser'];
			currentUser.user = user;
			users[currentUser.index] = user;
			storage.set({currentUser: currentUser});
			storage.set({users: users});
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