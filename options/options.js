
var Logs = [];
var storage = chrome.storage.local;

$(document).ready(function() {
	$('#saveConfig').on('click', saveConfig);
	$('#removeLogs').on('click', removeLogs);
	initData();
});

function initData(){
	storage.get(['Logs', "config"], function (o) {
		if (o.hasOwnProperty('Logs')) {
			Logs = o['Logs'];
			showLogs();
		} else {
			storage.set({Logs: []});
		}
		if (o.hasOwnProperty('config')) {
			var config = o['config'];
			$("#IPONumber").val(config.IPONumber);
			$("#IPOCount").val(config.IPOCount);
            $("#debug").attr('checked', config.debug);
		} else {
			saveConfig();
		}
	});
}

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

function saveConfig(){
	var data = {};
	data.IPONumber = $("#IPONumber").val();
	data.IPOCount = $("#IPOCount").val();
    data.debug = $("#debug").is(':checked');
	//data.startHour = parseInt($("#startHour").val());
	//data.startMinute = parseInt($("#startMinute").val());
	storage.set({config: data});
	sendMessage("saveConfig");
}

function sendMessage(cmd, data){
	chrome.runtime.sendMessage({cmd: cmd, data: data}, function(response) {

	});
}