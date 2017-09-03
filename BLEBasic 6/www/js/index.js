console.log("starting index.js")

var SCAN_TIME = 7000;           // Scan for 7 seconds
var CONNECTION_TIMEOUT = 7000;  // Wait for 7 seconds for a valid connection

// *********   Global variables used for all IDs that are used in multiple functions
var refreshDevicesModal = null;
var connectingModal = null;
var deviceList = null;
var deviceObjectMap = null;
var pageNavigator = null;
var connectingDevice = null;
var connectionTimeout = null;

var customService = "f9dab382-6439-4707-b4c9-912b383115fe";
var currentTimeCharacteristic = "FF01";
var taskDueDateCharacteristic = "FF02";
var taskPriorityCharacteristic = "FF03";
var taskNameCharacteristic = "FF04";
var deleteElementCharacteristic = "FF05";

var curhour;
var curminutes;
var curseconds;
var curmonth;
var curday;
var curyear;
var elementArray = [];
var dueDateArray = [];
var displayArray = [];

// check elements to see if they're past the due date

function checkElements() {

  var dateToUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());

  for (i = 0; i < 50; i++) {
    // console.log("element " + i + " is: " + elementArray[i]);
    if (elementArray[i] != "null") {
      // console.log("Currtime is " + dateToUTC + " and dueDate is " + dueDateArray[i]);
        if (dateToUTC >= dueDateArray[i]) { // 
          console.log("yay! within the if.");
            var id = elementArray[i];
            var elem = document.getElementById(id);
            console.log("id is " + id + ", and elem is " + elem);
            console.log("elem value is: " + elem.value);
            elem.parentNode.removeChild(elem);

            console.log("removed the element");

            elementArray[i] = "null";
            dueDateArray[i] = "null";
            

            // need to turn off the display
            if (displayArray[i] === "true") {
                deleteElementCharacteristic_write();
            }

            displayArray[i] = "null";
        }
    }
  }
}

// show & hide the dialogs

var showDialog = function(id) {
  document
    .getElementById(id)
    .show();
};

var hideDialog = function(id) {
  document
    .getElementById(id)
    .hide();
};

// delete the task when the trash icon is clicked

function trashTask(id) {

  console.log('trashtask clicked');
  console.log('id is: ' + id.id);
  console.log("id value is: " + id.value);
  
  var idid = id.id;
  var justNum = idid.split("added_")[1];

  // console.log(document.getElementById(id.id).value);
  elementArray[justNum] = "null";
  dueDateArray[justNum] = "null";

  if (displayArray[justNum] === "true") {
     deleteElementCharacteristic_write();
  }

  displayArray[justNum] = "null";
  console.log("elementArray became " + elementArray[justNum]);
  console.log("dueDateArray became " + dueDateArray[justNum]);
  console.log("displayArray became " + displayArray[justNum]);

  id.parentNode.removeChild(id);
}

// get current time on load

function getCurrTime() {

    date = new Date();

    curhour = date.getHours();
    if (curhour < 10) {
        curhour = "0" + curhour;
    }
    curminutes = date.getMinutes();
    if (curminutes < 10) {
        curminutes = "0" + curminutes;
    }
    curseconds = date.getSeconds();
    if (curseconds < 10) {
        curseconds = "0" + curseconds;
    }
    curmonth = date.getMonth() + 1;
    if (curmonth < 10) {
        curmonth = "0" + curmonth;
    }
    curday = date.getDate();
    if (curday < 10) {
        curday = "0" + curday;
    }
    curyear = date.getFullYear();

    
}


// save the task when the save button is clicked

var pointer = 0;

function saveTask() {

    console.log("save clicked");
  var title = document.getElementById('titleInput').value;
  var priority = document.getElementById('selectPriority').value;
  var duedate = document.getElementById('displayCurrentTime').value;

  var addHere = document.getElementById('addedTasks');
  addHere.insertAdjacentHTML('beforeend', '<ons-list-item ' + 'id="added_' + pointer + '">' +
    '<div class="left" style="font-size: 13px;" id="title_' + pointer + '">' + '<i class="fa fa-television" style="color: grey; font-size: 21px;" aria-hidden="true" onclick="changeDisplay(' + 'added_' + pointer + ')"></i>' + '&nbsp;&nbsp;&nbsp;&nbsp;' + title + '</div>' +
    '<div class="right" style="font-size: 13px;" id="prDue_' + pointer + '">' + 'Priority: ' + priority + ' | ' +
    'Due Date: [' + duedate + '] &nbsp;&nbsp;&nbsp;&nbsp;' + 
    '<i class="fa fa-trash-o" style="color: grey; font-size: 23px;" aria-hidden="true" onclick="trashTask(' + 'added_' + pointer + ')"></i>' +
    '</div>' +
    '</ons-list-item>');

  console.log(duedate);

  var hour = duedate.split(":")[0];
  var min = duedate.split(":")[1];
  var sec = duedate.split(":")[2].split(", ")[0];
  var month = duedate.split(":")[2].split(", ")[1].split("/")[0];
  var day = duedate.split(":")[2].split(", ")[1].split("/")[1];
  var year = duedate.split(":")[2].split(", ")[1].split("/")[2];

  month = parseInt(month) - 1;
  day = parseInt(day);

  console.log(hour +"#"+ min +"#"+ sec +"#"+ month +"#"+ day +"#"+ year);
  var duedateInUTC = Date.UTC(year, month, day, hour, min, sec, 0);
  console.log(duedateInUTC);

  elementArray[pointer] = "added_" + pointer;
  dueDateArray[pointer] = duedateInUTC;
  displayArray[pointer] = "false";

  console.log("elementArray[" + pointer + "] is " + elementArray[pointer]);
  console.log("dueDateArray[" + pointer + "] is " + dueDateArray[pointer]);
  console.log("displayArray[" + pointer + "] is " + displayArray[pointer]);

  pointer = pointer + 1;
}

//-------------------------------------------------------------------------------------------------------------
    // **** Functions for notification related events
//-------------------------------------------------------------------------------------------------------------

var date = new Date();

function currentTimeCharacteristic_Notify(buffer) {

    var array = new Uint8Array(buffer);
    var x = (array[0] << 24) | (array[1] << 16) | (array[2] << 8) | (array[3]);

    date = new Date(x * 1000);
    date.setTime( date.getTime() + date.getTimezoneOffset() *60 *1000 );

    // console.log("UTC time: " + x);
    // console.log("Real time: " + date);

    var hour = date.getHours();
    if (hour < 10) {
        hour = "0" + hour;
    }
    var minutes = date.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    var seconds = date.getSeconds();
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    var year = date.getFullYear();

    // console.log("Time values are --- hour:" + hour + ", min:" + minutes + ", sec:" + seconds + ", month:" + month + ", day:" + day + ", year:" + year);
    document.getElementById("displayCurrentTime2").value = hour+":"+minutes+":"+seconds+", "+month+"/"+day+"/"+year;
}

function deleteElementCharacteristic_Notify(buffer) {

  var array = new Uint8Array(buffer);

  if (array[0] === 1) {
    var id = array[1];
    console.log("current delete element value is: TRUE");

    elementArray[id] = "null";
    dueDateArray[id] = "null";
    displayArray[id] = "null";

    id = "added_" + id;
    console.log("id: " + id);

    var elem = document.getElementById(id);

    elem.parentNode.removeChild(elem);
    console.log("Removed the element");

  }

  else if (array[0] === 0) {
    // don't do anything
    console.log("current delete element value is: FALSE");
  }

}


//-------------------------------------------------------------------------------------------------------------
    // **** Functions for notification related events       END
//-------------------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------------------
    // **** Functions for write related events
//-------------------------------------------------------------------------------------------------------------

function writeCurrTime() {

    console.log("writeCurrTime");

    var set_date = new Date();

    console.log("Date set: " + set_date)

    var dateToUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    dateToUTC = dateToUTC / 1000;
    console.log("In UTC seconds: " + dateToUTC);

    var data = new Uint8Array(4);

    data[0] = dateToUTC >> 24;
    data[1] = dateToUTC >> 16;
    data[2] = dateToUTC >> 8;
    data[3] = dateToUTC;

    console.log("Data: " + data[0] + ", " + data[1] + ", " + data[2] + ", " + data[3])

    ble.write(connectingDevice.id, customService, currentTimeCharacteristic, data.buffer);
 
}

function strip(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function changeDisplay(id) {
  console.log("start of changeDisplay");
  showDialog('dialog-2');

  displayArray[id.id.replace('added_','')] = "true";
  console.log("displayArray[" + id.id.replace('added_','') + "] became: " + displayArray[id.id.replace('added_','')]);

  var title = "title_" + id.id;
  title = title.replace('added_','');
  var prDue = "prDue_" + id.id;
  prDue = prDue.replace('added_','');

  var titleVal = document.getElementById(title).textContent;
  var prDueVal = document.getElementById(prDue).textContent;

  priorityVal = prDueVal.replace('Priority: ','');

  priorityVal = priorityVal.split(" | ")[0];
  duedateVal = prDueVal.split('[')[1];
  duedateVal = duedateVal.replace(']','');

  titleVal = strip(titleVal);

  console.log("titleVal: " + titleVal);
  console.log("priorityVal: " + priorityVal);
  console.log("duedateVal: " + duedateVal);

  var hour = duedateVal.split(":")[0];
  var min = duedateVal.split(":")[1];
  var sec = duedateVal.split(":")[2].split(", ")[0];
  var month = duedateVal.split(":")[2].split(", ")[1].split("/")[0];
  var day = duedateVal.split(":")[2].split(", ")[1].split("/")[1];
  var year = duedateVal.split(":")[2].split(", ")[1].split("/")[2];

  month = parseInt(month) - 1;
  day = parseInt(day);

  console.log(hour +"#"+ min +"#"+ sec +"#"+ month +"#"+ day +"#"+ year);

  var set_date = new Date(year,month,day,hour,min,sec,0);
  console.log("Date: " + set_date)

  var dateToUTC = Date.UTC(year,month,day,hour,min,sec,0);
  dateToUTC = dateToUTC / 1000;
  console.log("In UTC seconds: " + dateToUTC);

  console.log("titleVal.length: ");
  console.log(titleVal.length);

  //***********************************************************************************
  //***********************************************************************************
  //***********************************************************************************
  //***********************************************************************************
  //***********************************************************************************
  //  if (titleVal.length >= 20) { // if we have 51 -> send 3 times 0-18, 19-38, 39-50
  //   var a = parseInt((titleVal.length-19) / 20); // (51-19)/20 = 32/20 = 1
  //   var b = (titleVal.length-19) % 20; // 12
  //   //2: send two more after sending the first 19

  //   // column: 20, row: a

  //   var titleData = new Uint8Array(20);

  //   titleData[0] = id.id.replace('added_','') >> 8 * 19;

  //   for (i = 1; i < 20; i++) {
  //     titleData[i] = titleVal.charAt(i-1) >> 8 * (19 - i);
  //   }
  //   // charAt(19-1) sent until 18.

  //   ble.write(connectingDevice.id, customService, taskNameCharacteristic, titleData.buffer);
  //   //------------------------------first 19 elements ------------------------

  //   // now we send the other two

  //   for (k = 0; k < a; k++) {
  //     var titleDataFirst = new Uint8Array(20);
  //     for (j = 0; j < 20; j++) {
  //       titleDataFirst[j] = titleVal.charAt( 20*(k+1) + j - 1 ) >> 8 * (19-j);
  //     }
  //     ble.write(connectingDevice.id, customService, taskNameCharacteristic, titleDataFirst.buffer);
  //   }

  //   var titleDataLast = new Uint8Array(b);

  //   for (l = 0; l < b; l++) { // b = 12
  //     titleDataLast[l] = titleVal.charAt(20*(a+1) - 1 + l) >> 8 * (b - 1 - l);
  //   }

  //   ble.write(connectingDevice.id, customService, taskNameCharacteristic, titleDataLast.buffer);

  // }

  // else {
    // var titleData = new Uint8Array(titleVal.length+1);
    // // if length = 3, create 4

    // titleData[0] = id.id.replace('added_','') >> (8 * titleVal.length);
    // // first element = we created 4, so bitshift >> 24. 8*3

    // for (i = 1; i <= titleVal.length; i++) {
    //   titleData[i] = titleVal.charAt(i-1) >> 8 * (titleVal.length - i);
    // }
    // // i <= 3. 1, 2, 3
    // // titleData[1] = titleVal.charAt(0) >> 8 * (3-1-1);
    // // titleData[1] = titleVal.charAt(0) >> 16
    // // titleData[2] = titleVal.charAt(1) >> 8 * (3-2)
    // // titleData[3] = titleVal.charAt(2)

    // ble.write(connectingDevice.id, customService, taskNameCharacteristic, titleData.buffer);
  // }

  // var titleData = new Uint8Array(titleVal.length+1);

  // for (i = 0; i < titleVal.length; i++) {
  //   titleData[i] = titleVal.charAt(i) >> 8 * (titleVal.length - i - 1);
  // }

  // ble.write(connectingDevice.id, customService, taskNameCharacteristic, titleData.buffer);

   var titleData = new Uint8Array(titleVal.length+1); // if hello: make Uint8(6)

   var idReplaced = id.id.replace('added_','') >> (8 * titleVal.length);

   console.log("id replaced is: " + idReplaced);

   titleData[0] = id.id.replace('added_',''); // title[0] = 0x00
   console.log("id is: " + id.id.replace('added_',''));

   for(i=1; i < titleVal.length+1; i++) { // title[1] ~ title[5] : h e l l o ; i < 5
        titleData[i] = titleVal.charCodeAt(i-1);
    }

    for(i=1; i < titleVal.length+1; i++) {
        console.log("titleval:" + titleVal.charCodeAt(i-1));
    }

    ble.write(connectingDevice.id, customService, taskNameCharacteristic, titleData.buffer);




  var priorityData = new Uint8Array(2);
  var duedateData = new Uint8Array(5);

  priorityData[0] = id.id.replace('added_','');
  priorityData[1] = priorityVal;

  duedateData[0] = id.id.replace('added_','');
  duedateData[1] = dateToUTC >> 24;
  duedateData[2] = dateToUTC >> 16;
  duedateData[3] = dateToUTC >> 8;
  duedateData[4] = dateToUTC;

  ble.write(connectingDevice.id, customService, taskDueDateCharacteristic, duedateData.buffer);
  ble.write(connectingDevice.id, customService, taskPriorityCharacteristic, priorityData.buffer);

}

function deleteElementCharacteristic_write() {
  var deleteElementData = new Uint8Array(1);

  deleteElementData[0] = 1;

  ble.write(connectingDevice.id, customService, deleteElementCharacteristic, deleteElementData.buffer);
}

//-------------------------------------------------------------------------------------------------------------
    // **** Functions for write related events              END
//-------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------


// *********   Functions for scanning and scan related events

function scanFailed() {
    refreshDevicesModal.hide();
}

function scanStop() {
    ble.stopScan();
    refreshDevicesModal.hide();
}

function deviceDiscovered(device) {
    // Debugging: Console log of details of item
    // console.log(JSON.stringify(device));

    if(deviceObjectMap.get(device.id) == undefined ) {
        // New Device. Add it to the collection and to the window
        deviceObjectMap.set(device.id, device);

        // Identify the name or use a default
        var name = "(none)";
        if (device.name != undefined) {
            name = device.name;
        }

        // Create the Onsen List Item
        var item = ons._util.createElement('<ons-list-item modifier="chevron" tappable> ' +
            '<ons-row><ons-col><span class="list-item__title" style="font-size: 4vw;">' + device.id + '</span></ons-col></ons-row>' +
            '<ons-row><ons-col><span class="list-item__subtitle" style="font-size: 2vw;">RSSI:' + device.rssi + '</span></ons-col><ons-col><span style="font-size: 2vw;">Name: ' + name + '</span></ons-col></ons-row>' +
            '</ons-list-item>');

        // Set the callback function
        item.addEventListener('click', deviceSelected, false);

        // Associate the element in the list with the object
        item.device = device;

        // Iterate through the list and add item in place by RSSI
        var descendants = deviceList.getElementsByTagName('ons-list-item');
        var i;
        for(i=0;i<descendants.length;i++) {
            if(device.rssi > descendants[i].device.rssi) {
                descendants[i].parentNode.insertBefore(item, descendants[i]);
                return;
            }
        }
        // If it hasn't already returned, it wasn't yet inserted.
        deviceList.append(item);
    }
}

function startScan() {
    // Disable the window
    refreshDevicesModal.show();

    // Empty the list (on screen and Map)
    deviceList.innerHTML = "";
    deviceObjectMap = new Map();

    // Start the scan
    ble.scan([], SCAN_TIME, deviceDiscovered, scanFailed);

    // Re-enable the window when scan done
    setTimeout(scanStop, SCAN_TIME);
}



// ********   Functions for device connection related events

function deviceConnectionSuccess(device) {
    clearTimeout(connectionTimeout);
    connectingModal.hide();
    connectingDevice = device;

    getCurrTime();
    console.log("did getCurrTime");
    writeCurrTime();
    console.log("did writeCurrTime");
    ble.startNotification(connectingDevice.id, customService, currentTimeCharacteristic, currentTimeCharacteristic_Notify);
    console.log("did notifyCurrTime");
    ble.startNotification(connectingDevice.id, customService, deleteElementCharacteristic, deleteElementCharacteristic_Notify);

    for (ran = 0; ran < 50; ran++) {
      elementArray[ran] = "null";
    }
    for (ran = 0; ran < 50; ran++) {
      dueDateArray[ran] = "null";
    }
    for (ran = 0; ran < 50; ran++) {
      displayArray[ran] = "null";
    }
    var x = setInterval(checkElements, 1000);
    console.log("did setInterval");
}

function deviceConnectionFailure(device) {
    console.log("Device Disconnected");
    pageNavigator.popPage();
    refreshDevicesModal.hide();
    connectingDevice = null;
}

function deviceConnectionTimeout() {
    // Device connection failure
    console.log("connection failure");
    connectingModal.hide();
    console.log("1");
    pageNavigator.popPage();
    console.log("2");
    refreshDevicesModal.hide();
    console.log("3");
    if(connectingDevice != null)
        ble.disconnect(connectingDevice.id);
}

function disconnectDevice() {
    console.log("Disconnecting");
    // if(connectingDevice !== null)
    //     ble.disconnect(connectingDevice.id);
}

function writeSuccess() {
    console.log("Write Success");
}

function writeFailure() {
    console.log("Write Failure");
}


// ***** Function for user-interface selection of a device
function deviceSelected(evt) {
    var device = evt.currentTarget.device;
    // Initiate a connection and switch screens; Pass in the "device" object
    pageNavigator.pushPage('page1.html', {data: {device: evt.currentTarget.device}});
    connectingDevice = device;
    ble.connect(device.id, deviceConnectionSuccess, deviceConnectionFailure);
    connectionTimeout = setTimeout(deviceConnectionTimeout, CONNECTION_TIMEOUT);
}

// *****  Function for initial startup
ons.ready(function() {
    console.log("Ready");

    // Initialize global variables
    refreshDevicesModal = document.getElementById('refreshDevicesModal');
    pageNavigator = document.querySelector('#pageNavigator');
    // pageNavigator.addEventListener('postpop', disconnectDevice);
    pageNavigator.addEventListener('postpop', function(event) {

        var page = event.target;

        if (page.id === 'page1') {
            disconnectDevice;
        }
        else if (page.id === 'page2') {
            // none
        }
    });

    var refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click',  function() {
            console.log("Refresh; Showing modal");
            startScan();
    } );

    deviceList = document.getElementById('deviceList');

    // Add a "disconnect" when app auto-updates
    if(typeof window.phonegap !== 'undefined') {
        // Works for iOS (not Android)
        var tmp = window.phonegap.app.downloadZip;
        window.phonegap.app.downloadZip = function (options) {
            disconnectDevice();
            tmp(options);
        }
    }
});

function newButtonClick() {
    // console.log(pageNavigator.topPage.data);
    console.log("clicked new button");
    document.querySelector('#pageNavigator').pushPage('page2.html', {data: {title: 'New Task'}});
    console.log("clicked new button");
    // getCurrTime();
    // document.getElementById("displayCurrentTime").value = curhour+":"+curminutes+":"+curseconds+", "+curmonth+"/"+curday+"/"+curyear;
}

function returnToMain() {
    // console.log("clicked back button");
    // document.querySelector('#pageNavigator').pushPage('page1.html');
    // getCurrTime();
    // document.getElementById("displayCurrentTime2").value = curhour+":"+curminutes+":"+curseconds+", "+curmonth+"/"+curday+"/"+curyear;
}

// *** Functions for page navigation (page change) events
document.addEventListener('init', function(event) {
    var page = event.target;

    if (page.id === 'page1') {
        // Enable the modal window
        connectingModal = document.getElementById('connectingModal');
        connectingModal.show();

        // Update the page's title bar
        page.querySelector('ons-toolbar .center').innerHTML = "Task Reminder";

        getCurrTime();
        document.getElementById("displayCurrentTime2").value = curhour+":"+curminutes+":"+curseconds+", "+curmonth+"/"+curday+"/"+curyear;
    }
    else if (page.id === 'page2') {
        getCurrTime();
        page.querySelector('ons-toolbar .center').innerHTML = page.data.title;
        document.getElementById("displayCurrentTime").value = curhour+":"+curminutes+":"+curseconds+", "+curmonth+"/"+curday+"/"+curyear;
    }
});
console.log("loaded index.js");
