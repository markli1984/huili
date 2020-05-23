
var Logs = [];
var pageLogs = [];
var userData = {};
var storage = chrome.storage.local;

$(document).ready(function() {
	$('#tbUser').datagrid({
		width: 500,
		heigth: "auto",
		fitColumns: true,
		onCheck: function(rowIndex, rowData){
			if(rowData.skip){
				rowData.skip = false;
			} else {
				rowData.skip = true;
			}
			loadUserData();
			sendMessage("skipUser", rowData);
		},
		singleSelect: false,
		selectOnCheck: false,
		checkOnSelect: false
	});
	$('#saveUser').on('click', saveUser);
	$('#inputUser').on('click', inputUser);
	$('#saveConfig').on('click', saveConfig);
	$('#removeLogs').on('click', removeLogs);
	$('#removePageLogs').on('click', removePageLogs);
	$('#deleteTable').on('click', postDelete);
	initData();
	listenMessages();
});

function initData(){
	storage.get(['currentUser', 'Logs', "pageLogs", "users", "config"], function (o) {
		if (o.hasOwnProperty('users') && o.hasOwnProperty('currentUser')) {
			var users = o['users'];
			userData = {"total": users.length, "rows": users};
			loadUserData();
		}
		if (o.hasOwnProperty('pageLogs')) {
			pageLogs = o['pageLogs'];
			showPageLog();
		} else {
			storage.set({pageLogs: []});
		}
		if (o.hasOwnProperty('Logs')) {
			Logs = o['Logs'];
			showLogs();
		} else {
			storage.set({Logs: []});
		}
		if (o.hasOwnProperty('config')) {
			var config = o['config'];
			$("#ip").val(config.ip);
			$("#fp").val(config.fp);
			$("#cid").val(config.cid);
			$("#telephone").val(config.telephone);
			$("#refeshWord").val(config.refeshWord);
			$("#reloadTime").val(config.reloadTime);
			$("#debug").attr('checked', config.debug);
			$("#quick").attr('checked', config.quick);
			$("#autoStart").attr('checked', config.autoStart);
			$("#SMS1").attr('checked', config.SMS1);
			$("#post").attr('checked', config.post);
			$("#rr1").val(config.rr1);
			$("#rr2").val(config.rr2);
		} else {
			saveConfig();
		}
	});
}

var buildPageLogRow = function (index, rowData) {
	var row = "<div id='divpagelog" + index + "'></div>";
	row += "<p>User : " + rowData.Name +"</p>";
	row += "<p>Time : " + rowData.Time +"</p>";
	row += "<p id='pagelog" + index + "'></p>";
	row += "</div>";

	return row;
};

function showPageLog() {
	$("#pageLogs").html("");
	for (var i = 0; i < pageLogs.length; i++) {
		if (i === 0) {
			$("#pageLogs").html(buildPageLogRow(i, pageLogs[i]));
		}
		var lastDiv = $("div[id=divpagelog" + (i - 1) + "]");
		lastDiv.last().after(buildPageLogRow(i, pageLogs[i]));
		$("#pagelog"+i).text(pageLogs[i].PageContent);
	}
}

function buildLogRow (index) {
	var row = "<div id='log" + index + "'></div>";

	return row;
};

function showLogs() {
	$("#logs").html("");
	for (var i = 0; i < Logs.length; i++) {
		if (i === 0) {
			$("#logs").html(buildLogRow(i));
		}
		var lastDiv = $("div[id=log" + (i - 1) + "]");
		lastDiv.last().after(buildLogRow(i));
		$("#log"+i).text(Logs[i]);
	}
}

function removeLogs(){
	storage.remove("Logs");
	Logs = [];
	showLogs();
}

function removePageLogs(){
	storage.remove("PageLogs");
	pageLogs = [];
	showPageLog();
}

function saveConfig(){
	var data = {};
	data.ip = $("#ip").val();
	data.fp = $("#fp").val();
	data.cid = $("#cid").val();
	data.telephone = $("#telephone").val();
	data.refeshWord = $("#refeshWord").val();
	data.reloadTime = parseInt($("#reloadTime").val());
	data.debug = $("#debug").is(':checked');
	data.quick = $("#quick").is(':checked');
	data.autoStart = $("#autoStart").is(':checked');
	data.SMS1 = $("#SMS1").is(':checked');
	data.post = $("#post").is(':checked');
	data.rr1 = parseInt($("#rr1").val());
	data.rr2 = parseInt($("#rr2").val());
	data.postCreatCount = parseInt($("#postCreatCount").val());
	data.startHour = parseInt($("#startHour").val());
	data.startMinute = parseInt($("#startMinute").val());
	storage.set({config: data});
	sendMessage("saveConfig");
}

function saveUser(){
	var content = $("#userContent").val();
	var users = content.split('\n');
	var userInfos = [];
	for (var i = 1; i < users.length; i++) {
		var user = buildUserInfo(users[i]);
		if(user){
			userInfos.push(user);
		}
	}
	userData = {"total": userInfos.length, "rows": userInfos};
	loadUserData();
	$("#userContent").hide();

	//save users and set currentuser
	storage.set({currentUser: {index: 0, user: userInfos[0]}});
	storage.set({users: userInfos});

	sendMessage("saveUsers", userInfos[0]);
}

function inputUser(){
	//$("#userContent").val("");
	$("#userContent").show();
}

function buildUserInfo(userTxt){
	if (userTxt) {
		var spitChar = '\t';
		if($("#isCSV").is(':checked')){
			spitChar = ',';
		}
		var items = userTxt.split(spitChar);
		var item = {
			name: items[0],
			status: 0,
			skip: false,
			userinfo: {
				name: items[0],
				login: items[1],
				password: items[2],
				visaType: items[3],
				loginPage: items[4],
				visaCountry: items[5],
				familyName: items[6],
				givenName: items[7],
				gender: items[8],
				dateBirth: items[9],
				countryBirth: items[10],
				streetName: items[11],
				city: items[12],
				addressCountry: items[13],
				email: items[14],
				pNO: items[15],
				pExpire: items[16],
				iIssued: items[17],
				iExpire: items[18],
				inDate: items[19],
				isNew: items[20],
				dateNew: items[21],
				payName: items[22],
				payType: items[23],
				payNumber: items[24],
				paySafe: items[25],
				payExpire: items[26],
				payOwner: items[27],
				telephone: items[28]
			}
		}

		return item;
	} else {
		return null;
	}
}

function loadUserData(){
	$('#tbUser').datagrid("loadData", userData);
}

function sendMessage(cmd, data){
	chrome.runtime.sendMessage({cmd: cmd, data: data}, function(response) {

	});
}

function postDelete(){
	var tableID = $("#tbID").val();
	if(tableID){
		sendMessage("postDeleteTable", tableID);
	} else {
		alert("input table id!!");
	}
}

function listenMessages() {
	chrome.runtime.onMessage.addListener(function(msg, sender, callback){
		if(!msg || !msg.cmd) {
			console.error("unsupported command:", msg);
			return;
		}
		switch(msg.cmd) {
			case "updateUserStatus":
				if (userData.rows && userData.rows.length > 0) {
					for (var i = 0; i < userData.rows.length; i++) {
						if(userData.rows[i].name === msg.data.name){
							userData.rows[i].status = msg.data.status;
						}
					}
				}
				loadUserData();
				break;
			default :
				break;
		}
	});
}