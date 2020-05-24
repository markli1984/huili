/**
 * @author Li Chunhui
 */
// location.href 是这些时，执行对应的功能
var WHV_CHECK_TABLE = "immigration.govt.nz/WorkingHoliday/";
var WHV_URL_HOME = "immigration.govt.nz/migrant/default.htm";

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
			main(true);
			break;
		case "halfAuto":
			halfAuto = true;
			main(false);
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
		if (o.hasOwnProperty('halfAuto')) {
			halfAuto = o['halfAuto'];
		}
		callback();
	});
}

function main(checkha){
	storage.get(['config'], function (o) {
		if (o.hasOwnProperty('config')) {
			var config = o['config'];
			debugMode = config.debug;
			selectCount();
		}
	});
}

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

		user.successCreate = true;
		user.ApplicationID = tableID;


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
	} else {
		if (!halfAuto) {
			GotoUrl("https://onlineservices." + WHV_CREATE_TABLE + COUNTRY_ID);
		}
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

function sendMessage(cmd, data, name){
	chrome.runtime.sendMessage({cmd: cmd, data: data, name: name}, function(response) {
		console.error(response);
		saveLog(response);
	});
}

init();